// src/bot/skills/ask.ts
import type { Bot, Message, Reply } from "../core.js";

/**
 * "ask" stub skill:
 *  - "ask say hi"      -> "hi"
 *  - "ask what is 2+2" -> "4"
 *  - otherwise         -> echo back as stub
 */
export function registerAsk(bot: Bot) {
  bot.use(/^ask\s+(.+)/i, (msg: Message): Reply | void => {
    const m = msg.text.match(/^ask\s+(.+)/i);
    if (!m) return;
    const q = m[1].trim().toLowerCase();

    if (q === "say hi" || q === "hi") return { text: "hi" };
    if (/^what\s*is\s*2\s*\+\s*2$/.test(q)) return { text: "4" };

    return { text: `stub heard: "${q}"` };
  });
}

export default registerAsk;
