// src/bot/skills/index.ts
import type { Bot } from "../core.js";
import { registerEcho } from "./echo.js";
import { registerReverse } from "./reverse.js";
import registerAsk from "./ask.js";

export function registerSkills(bot: Bot) {
  registerEcho(bot);
  registerReverse(bot);
  registerAsk(bot);
}

export default registerSkills;
