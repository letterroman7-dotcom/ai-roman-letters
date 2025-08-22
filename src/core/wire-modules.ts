// src/core/wire-modules.ts
import type { App } from "../types/app.js";
import registerHealth from "../modules/health/index.js";
import registerGuardian from "../modules/guardian/index.js";

/**
 * Wires all runtime modules into the given app.
 * Returns the list of loaded module names (for logging/telemetry).
 */
export async function wireModules(app: App): Promise<string[]> {
  await registerHealth(app);
  app.log.info("health module initialized");

  await registerGuardian(app);
  app.log.info("guardian module initialized");

  return ["health", "guardian"];
}
