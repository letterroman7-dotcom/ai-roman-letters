// src/bot/demo.ts
import type { Bot, Message, Reply } from "./core.js";
import { registerAsk } from "./skills/ask.js";
import { registerSum } from "./skills/sum.js";

/**
 * Wires all demo skills onto the provided bot:
 *  - echo
 *  - reverse
 *  - ask
 *  - sum
 */
export function registerDemo(bot: Bot): void {
  // echo
  bot.use(/^echo\s+(.+)/i, (msg: Message): Reply | void => {
    const m = msg.text?.match(/^echo\s+(.+)/i);
    if (!m || !m[1]) return;
    return { text: m[1] };
  });

  // reverse
  bot.use(/^reverse\s+(.+)/i, (msg: Message): Reply | void => {
    const m = msg.text?.match(/^reverse\s+(.+)/i);
    if (!m || !m[1]) return;
    const s = m[1].split("").reverse().join("");
    return { text: s };
  });

  // other skills
  registerAsk(bot);
  registerSum(bot);
}
