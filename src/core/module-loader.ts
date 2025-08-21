import config from "../utils/config.js";
import logger from "../utils/logger.js";

export async function loadModules(): Promise<void> {
  const mods = config.modules;
  if (!mods.length) {
    logger.info({ modules: [] }, "No modules configured");
    return;
  }
  // Minimal loader: we just log for now; real modules will be dynamically imported here.
  logger.info({ modules: mods }, "Modules loaded");
}
