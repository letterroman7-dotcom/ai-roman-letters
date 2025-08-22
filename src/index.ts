// src/index.ts
// Build the bot and register skills.

import { Bot } from "./bot/core.js";
import { registerDemo } from "./bot/demo.js";
import { registerAsk } from "./bot/skills/ask.js";

export function createBot(): Bot {
  const bot = new Bot();
  registerDemo(bot);
  registerAsk(bot);
  return bot;
}

export default createBot;
