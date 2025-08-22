// src/bot/skills/index.ts
import type { Bot } from "../core.js";
import { registerDemo } from "../demo.js";

/** Register all built-in demo skills. */
export default function registerSkills(bot: Bot): void {
  registerDemo(bot);
}

// Useful re-exports
export { registerDemo } from "../demo.js";
export type { Bot } from "../core.js";
