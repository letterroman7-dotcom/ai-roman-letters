// src/modules/panic/index.ts
import { getPanic, setPanic, resolvePanicPath } from "../guardian/panic.js";

import type { App } from "../../types/app.js";

export default async function registerPanic(app: App) {
  app.registerCommand("panic:status", async () => {
    const on = await getPanic();
    return { ok: true, panic: on };
  });

  app.registerCommand("panic:on", async () => {
    await setPanic(true);
    const file = resolvePanicPath();
    return { ok: true, panic: true, file };
  });

  app.registerCommand("panic:off", async () => {
    await setPanic(false);
    const file = resolvePanicPath();
    return { ok: true, panic: false, file };
  });

  app.log.info({ module: "panic" }, "panic module initialized");
}
