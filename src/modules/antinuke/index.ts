// src/modules/antinuke/index.ts
import path from "node:path";

import { ActionPipeline } from "../../core/action-pipeline.js";
import { readJson, writeJson } from "../../utils/json-store.js";
import { logger } from "../../utils/logger.js";

import type { App } from "../../types/app.js";

type Thresholds = {
  bans: number;
  kicks: number;
  channelCreates: number;
  channelDeletes: number;
  roleCreates: number;
  roleDeletes: number;
  webhookCreates: number;
  webhookDeletes: number;
  emojiCreates: number;
  emojiDeletes: number;
};

type Policy = {
  enabled: boolean;
  windowMs: number;
  thresholds: Thresholds;
  actionOnTrip: "warn" | "timeout" | "mute" | "quarantine" | "ban" | "log";
  timeoutSeconds?: number;
};

const DEFAULTS: Policy = {
  enabled: true,
  windowMs: 10_000,
  thresholds: {
    bans: 3,
    kicks: 4,
    channelCreates: 4,
    channelDeletes: 3,
    roleCreates: 4,
    roleDeletes: 3,
    webhookCreates: 2,
    webhookDeletes: 2,
    emojiCreates: 5,
    emojiDeletes: 3,
  },
  actionOnTrip: "quarantine",
  timeoutSeconds: 600,
};

const dataFile = path.join(
  process.cwd(),
  "src",
  "modules",
  "antinuke",
  "data",
  "antinuke-config.json",
);

// in-memory sliding window counters keyed by actor + kind
type Key = `${string}:${string}`;
const counters = new Map<Key, Array<number>>();

function bump(kind: string, actorId: string, now = Date.now()): number {
  const k: Key = `${actorId}:${kind}`;
  const arr = counters.get(k) ?? [];
  arr.push(now);
  counters.set(k, arr);
  return arr.length;
}

function sweep(windowMs: number, now = Date.now()) {
  for (const [k, arr] of counters.entries()) {
    const kept = arr.filter((t) => now - t <= windowMs);
    if (kept.length) counters.set(k, kept);
    else counters.delete(k);
  }
}

async function getPolicy(): Promise<Policy> {
  return readJson<Policy>(dataFile, DEFAULTS);
}
async function setPolicy(p: Policy): Promise<void> {
  await writeJson(dataFile, p);
}

export default async function registerAntiNuke(app: App) {
  const pipe = new ActionPipeline(app.log);

  app.registerCommand("antinuke:status", async () => {
    const p = await getPolicy();
    return { ok: true, policy: p };
  });

  app.registerCommand("antinuke:enable", async () => {
    const p = await getPolicy();
    p.enabled = true;
    await setPolicy(p);
    return { ok: true, enabled: true };
  });

  app.registerCommand("antinuke:disable", async () => {
    const p = await getPolicy();
    p.enabled = false;
    await setPolicy(p);
    return { ok: true, enabled: false };
  });

  // antinuke:set {"windowMs":8000,"thresholds":{"bans":2,...}, "actionOnTrip":"timeout","timeoutSeconds":300}
  app.registerCommand("antinuke:set", async (args: unknown[]) => {
    const raw = (args?.[0] ?? "").toString();
    if (!raw) throw new Error("Provide JSON policy payload");
    let next: Policy;
    try {
      next = JSON.parse(raw);
    } catch {
      throw new Error("Invalid JSON");
    }
    const merged = {
      ...DEFAULTS,
      ...next,
      thresholds: { ...DEFAULTS.thresholds, ...(next as any).thresholds },
    };
    await setPolicy(merged as Policy);
    return { ok: true, policy: merged };
  });

  // These detector shims simulate events. Later we’ll wire real Discord events.
  // Usage example:
  //   cmd: antinuke:simulate bans <actorId> <count>
  app.registerCommand("antinuke:simulate", async (args: unknown[]) => {
    const kind = String(args?.[0] ?? "");
    const actorId = String(args?.[1] ?? "actor");
    const count = Number(args?.[2] ?? 1);
    const policy = await getPolicy();
    if (!policy.enabled) return { ok: true, ignored: true, reason: "disabled" };

    const now = Date.now();
    for (let i = 0; i < count; i++) {
      bump(kind, actorId, now + i);
    }
    sweep(policy.windowMs, now + count);

    const th = policy.thresholds as any;
    const windowKey: Key = `${actorId}:${kind}`;
    const hits = counters.get(windowKey)?.length ?? 0;
    const limit = Number(th[kind] ?? 0);

    const tripped = limit > 0 && hits >= limit;
    if (tripped) {
      const ctx = {
        guildId: "demo",
        channelId: "demo",
        userId: actorId,
        reason: `Anti-Nuke: ${kind}=${hits} in ${policy.windowMs}ms (limit=${limit})`,
      };
      const act = policy.actionOnTrip;
      const req =
        act === "timeout"
          ? { kind: "timeout", seconds: policy.timeoutSeconds ?? 600, ctx }
          : ({ kind: act as any, ctx } as any);
      await pipe.dispatch(req);
      logger.warn({ kind, actorId, hits, limit }, "Anti-Nuke TRIPPED");
      // reset this actor/kind window after action
      counters.delete(windowKey);
    } else {
      logger.info({ kind, actorId, hits, limit }, "Anti-Nuke observed");
    }

    return { ok: true, kind, actorId, hits, limit, tripped };
  });

  app.log.info({ module: "antinuke" }, "anti-nuke module initialized");
}
