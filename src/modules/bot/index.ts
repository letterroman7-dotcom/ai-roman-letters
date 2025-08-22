// src/modules/bot/index.ts
import type { App } from "../../types/app.js";
import { Bot } from "../../bot/core.js";
import registerSkills from "../../bot/skills/index.js";

export default async function registerBot(app: App) {
  const bot = new Bot({ onLog: (obj, msg) => app.log.info(obj, msg) });

  // load all skills (echo, reverse, ask)
  registerSkills(bot);

  // bot:send <...text...>
  app.registerCommand("bot:send", async (args: unknown[]) => {
    const text = String((args as string[]).join(" ")).trim();
    if (!text) return [];
    const replies = await bot.handle({ text });
    return replies.map((r) => r.text);
  });

  // quick demo showcasing skills (now includes 'ask' cases)
  app.registerCommand("bot:demo", async () => {
    const cases = [
      "echo hello world",
      "reverse abcdef",
      "ask say hi",
      "ask what is 2+2",
    ];
    const out: Record<string, string[]> = {};
    for (const t of cases) {
      const replies = await bot.handle({ text: t });
      out[t] = replies.map((r) => r.text);
    }
    return out;
  });

  app.log.info("bot module initialized");
}
