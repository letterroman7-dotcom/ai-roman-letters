// src/modules/health/index.ts
import type { App } from "../../types/app.js";

export default async function registerHealth(app: App) {
  app.registerCommand("health", () => {
    return { ok: true, ts: new Date().toISOString() };
  });
  // No log here—bootstrap logs module init.
}
