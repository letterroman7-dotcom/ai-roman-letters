// src/core/module-loader.ts
import type { App } from "../types/app.js";

export type ModuleRegistrar = (app: App) => Promise<void> | void;

export async function loadModules(
  app: App,
  registrars: ModuleRegistrar[],
): Promise<string[]> {
  const loaded: string[] = [];
  for (const reg of registrars) {
    await reg(app);
    const name = (reg as any).name || "module";
    loaded.push(name);
  }
  return loaded;
}
