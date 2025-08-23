// src/modules/restore/index.ts
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { writeJson, readJson } from "../../utils/json-store.js";

import type { App } from "../../types/app.js";

const CP_DIR = path.join(process.cwd(), "data", "restore", "checkpoints");

type Snapshot = {
  id: string; // 20250821-034212
  createdAt: string; // ISO
  envFile?: string; // path if present
  metaFile: string; // path
};

function tsId(d = new Date()): string {
  // 2025-08-21T03:42:12.345Z -> 20250821-034212
  const iso = d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  return `${iso.slice(0, 8)}-${iso.slice(9, 15)}`;
}

async function ensureDir() {
  await fsp.mkdir(CP_DIR, { recursive: true });
}

export default async function registerRestore(app: App) {
  app.registerCommand("restore:snapshot", async () => {
    await ensureDir();
    const id = tsId();
    const metaPath = path.join(CP_DIR, `${id}.json`);
    const envSrc = path.join(process.cwd(), ".env");
    const envOut = path.join(CP_DIR, `${id}.env`);

    const meta = {
      id,
      createdAt: new Date().toISOString(),
      system: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        host: os.hostname(),
      },
      pkg: (() => {
        try {
          const raw = fs.readFileSync(
            path.join(process.cwd(), "package.json"),
            "utf8",
          );
          const j = JSON.parse(raw);
          return {
            name: j.name,
            version: j.version,
            scripts: Object.keys(j.scripts ?? {}),
          };
        } catch {
          return null;
        }
      })(),
    };

    await writeJson(metaPath, meta);
    let wroteEnv = false;
    if (fs.existsSync(envSrc)) {
      const env = await fsp.readFile(envSrc, "utf8");
      await fsp.writeFile(envOut, env, "utf8");
      wroteEnv = true;
    }

    return {
      ok: true,
      id,
      files: [metaPath, wroteEnv ? envOut : null].filter(Boolean),
    };
  });

  app.registerCommand("restore:list", async () => {
    await ensureDir();
    const files = await fsp.readdir(CP_DIR);

    // Make TS happy: coerce to string[], validate IDs while building the set
    const ids: string[] = Array.from(
      new Set(
        files
          .map((f) => f.split(".")[0] ?? "")
          .filter((s): s is string => s.length > 0 && /^\d{8}-\d{6}$/.test(s)),
      ),
    ).sort();

    const items: Snapshot[] = [];
    for (const id of ids) {
      const metaFile = path.join(CP_DIR, `${id}.json`);
      const envFile = path.join(CP_DIR, `${id}.env`);
      const meta = await readJson<any>(metaFile, null);
      items.push({
        id, // ensured string
        createdAt: meta?.createdAt ?? "",
        metaFile,
        envFile: fs.existsSync(envFile) ? envFile : undefined,
      });
    }
    return { ok: true, items };
  });

  app.registerCommand("restore:apply", async (args: unknown[]) => {
    const id = String(args?.[0] ?? "");
    if (!/^\d{8}-\d{6}$/.test(id))
      throw new Error("restore:apply <id> where id=YYYYMMDD-HHMMSS");
    const envFile = path.join(CP_DIR, `${id}.env`);
    if (!fs.existsSync(envFile))
      throw new Error("No .env snapshot for that id");
    const target = path.join(process.cwd(), ".env");
    const tmp = `${target}.${Date.now()}.tmp`;
    const data = await fsp.readFile(envFile, "utf8");
    await fsp.writeFile(tmp, data, "utf8");
    await fsp.rename(tmp, target);
    return { ok: true, applied: target };
  });

  app.registerCommand("restore:delete", async (args: unknown[]) => {
    const id = String(args?.[0] ?? "");
    if (!/^\d{8}-\d{6}$/.test(id))
      throw new Error("restore:delete <id> where id=YYYYMMDD-HHMMSS");
    const paths = [
      path.join(CP_DIR, `${id}.json`),
      path.join(CP_DIR, `${id}.env`),
    ];
    let removed = 0;
    for (const p of paths) {
      try {
        await fsp.unlink(p);
        removed++;
      } catch {
        /* ignore */
      }
    }
    return { ok: true, removed };
  });

  app.log.info({ module: "restore" }, "restore module initialized");
}
