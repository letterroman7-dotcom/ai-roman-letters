// src/bot/skills/sum.ts
import type { Bot, Message, Reply } from "../core.js";

export function registerSum(bot: Bot): void {
  bot.use(/^sum\s+(.+)/i, (msg: Message): Reply | void => {
    const m = msg.text?.match(/^sum\s+(.+)/i);
    if (!m || !m[1]) return;

    const nums: number[] = m[1]
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));

    if (nums.length === 0) return;

    const total = nums.reduce((a: number, b: number) => a + b, 0);

    const text = Number.isInteger(total)
      ? String(total)
      : String(+total.toFixed(12))
          .replace(/\.0+$/, "")
          .replace(/(\.\d*?)0+$/, "$1");

    return { text };
  });
}
