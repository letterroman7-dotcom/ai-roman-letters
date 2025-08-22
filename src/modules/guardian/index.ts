// src/modules/guardian/index.ts
import type { App } from "../../types/app.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const panicDir = path.join(process.cwd(), "data", "guardian");
const panicLockFile = path.join(panicDir, "panic.lock");

async function pathExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readPanic(): Promise<boolean> {
  return pathExists(panicLockFile);
}

async function writePanic(state: boolean) {
  await fs.mkdir(panicDir, { recursive: true });
  if (state) {
    await fs.writeFile(panicLockFile, "1", "utf8");
  } else {
    if (await pathExists(panicLockFile)) {
      await fs.rm(panicLockFile, { force: true });
    }
  }
}

export default async function registerGuardian(app: App) {
  const panic = await readPanic();
  app.log.info({ panic, file: panicLockFile }, "Panic lock status");

  app.registerCommand("panic:status", async () => {
    const state = await readPanic();
    return { panic: state, file: panicLockFile };
  });

  app.registerCommand("panic:on", async () => {
    await writePanic(true);
    const state = await readPanic();
    app.log.info({ panic: state, file: panicLockFile }, "panic enabled");
    return { ok: true, panic: state };
  });

  app.registerCommand("panic:off", async () => {
    await writePanic(false);
    const state = await readPanic();
    app.log.info({ panic: state, file: panicLockFile }, "panic disabled");
    return { ok: true, panic: state };
  });

  app.registerCommand("checkpoint", async () => {
    const ts = new Date().toISOString();
    app.log.info({ ts, category: "checkpoint" }, "checkpoint");
    return { ok: true, ts };
  });
  // No extra init log here—bootstrap handles the one-time init log.
}
