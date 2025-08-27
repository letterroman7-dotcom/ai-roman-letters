// Demo wiring for the Bot class + ask skill

import { Bot } from "./core.js"; // NOTE: same folder => "./core.js"
import { registerAsk } from "./skills/ask.js"; // NOTE: named import + ".js" extension

const bot = new Bot();

// Register the "ask" skill on this demo bot instance
registerAsk(bot);

// Optional: start the bot if your Bot class requires it.
// void bot.start?.();
