// src/index.ts
import { Bot } from "./bot/core.js";
import registerSkills from "./bot/skills/index.js";

/** Construct a Bot with all built-in demo skills wired. */
export function createDemoBot(): Bot {
  const bot = new Bot();
  registerSkills(bot);
  return bot;
}

// Re-exports for convenience
export { Bot } from "./bot/core.js";
export type { Message, Reply, Handler } from "./bot/core.js";
