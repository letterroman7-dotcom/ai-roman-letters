// src/antinuke/window.ts
// Sliding-window counters + simple dedupe for AntiNuke

import { kv } from "../storage/index.js";

export type ActionKind = "channelDelete" | "roleDelete" | "webhooksUpdate" | (string & {});

// Scoring/tuning model (kept intentionally simple)
export interface AntiNukeTuning {
  windowMs: number;
  scorePerEvent: number;
  threshold: number;
}

const TUNING: AntiNukeTuning = {
  windowMs: 30_000,
  scorePerEvent: 0.5,
  threshold: 1,
};

const KEY_PREFIX = "antinuke:";
const EVT_PREFIX = `${KEY_PREFIX}evt:`;       // counters
const DEDUPE_PREFIX = `${KEY_PREFIX}dedupe:`; // dedupe markers

const toSec = (ms: number) => Math.ceil(ms / 1000);
const kEvent = (ev: string) => `${EVT_PREFIX}${ev}`;
const kDedupe = (id: string) => `${DEDUPE_PREFIX}${id}`;

export function currentAntiNukeTuning(): AntiNukeTuning {
  return TUNING;
}

/** Increment an action counter within the sliding window TTL. */
export async function recordAdminAction(kind: ActionKind, count = 1): Promise<number> {
  return kv.incr(kEvent(kind), count, toSec(TUNING.windowMs));
}

/** Build {event: count} snapshot of all counters (ignores dedupe keys). */
export async function statusByCategory(): Promise<Record<string, number>> {
  const keys = await kv.scan(EVT_PREFIX);
  const out: Record<string, number> = {};
  for (const k of keys) {
    const v = (await kv.get<number>(k)) ?? 0;
    const ev = k.slice(EVT_PREFIX.length);
    out[ev] = v;
  }
  return out;
}

/** Sum snapshot into a score using tuning. */
export async function getActorScore(): Promise<number> {
  const snap = await statusByCategory();
  const total = Object.values(snap).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  return total * TUNING.scorePerEvent;
}

/** Is score >= threshold? */
export async function isActorTriggered(): Promise<boolean> {
  const score = await getActorScore();
  return score >= TUNING.threshold;
}

/** Dedupe helpers (optional, used by enforcement paths). */
export async function wasDedupedRecently(dedupeKey: string): Promise<boolean> {
  const v = await kv.get<number>(kDedupe(dedupeKey));
  return v !== undefined;
}
export async function markDedupe(dedupeKey: string, windowMs: number): Promise<void> {
  await kv.set(kDedupe(dedupeKey), 1, toSec(windowMs));
}

/** Quick reset for demos/tests: clears ALL antinuke keys (counters + dedupe). */
export async function resetWindow(): Promise<void> {
  await kv.resetPrefix(KEY_PREFIX);
}
