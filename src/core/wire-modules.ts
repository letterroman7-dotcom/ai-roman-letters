// src/core/wire-modules.ts

import registerAntiNuke from "../modules/antinuke/index.js";
import registerBot from "../modules/bot/index.js";
import registerGuardian from "../modules/guardian/index.js";
import registerHealth from "../modules/health/index.js";
import registerHttp from "../modules/http/index.js";
import registerPanic from "../modules/panic/index.js";
import registerRestore from "../modules/restore/index.js";

import type { App } from "../types/app.js";

/**
 * Wires all runtime modules into the given app.
 * Returns the list of loaded module names (for logging/telemetry).
 */
export async function wireModules(app: App): Promise<string[]> {
  await registerHealth(app);
  await registerGuardian(app);
  await registerBot(app);
  await registerHttp(app);
  await registerAntiNuke(app);
  await registerPanic(app);
  await registerRestore(app);

  return ["health", "guardian", "bot", "http", "antinuke", "panic", "restore"];
}
