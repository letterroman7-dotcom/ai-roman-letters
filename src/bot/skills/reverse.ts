// src/bot/skills/reverse.ts
import type { Bot, Message, Reply } from "../core.js";

export function registerReverse(bot: Bot) {
  bot.use(/^reverse\s+(.+)/i, (msg: Message): Reply => {
    const m = msg.text.match(/^reverse\s+(.+)/i);
    const text = (m?.[1] ?? "").split("").reverse().join("");
    return { text };
  });
}

export default registerReverse;
