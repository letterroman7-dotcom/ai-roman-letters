// src/bot/skills/echo.ts
import type { Bot, Message, Reply } from "../core.js";

export function registerEcho(bot: Bot) {
  bot.use(/^echo\s+(.+)/i, (msg: Message): Reply => {
    const m = msg.text.match(/^echo\s+(.+)/i);
    const text = m?.[1] ?? "";
    return { text };
  });
}

export default registerEcho;
