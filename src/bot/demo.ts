// src/bot/demo.ts
import pino from "pino";
import { Bot } from "./core.js";
import type { Message } from "./core.js";

const devPretty =
  process.env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "UTC:yyyy-mm-dd HH:MM:ss.l" } }
    : undefined;

const log = pino({ name: "ai-bot", level: "info", transport: devPretty });

const bot = new Bot({
  onLog: (obj, msg) => log.info(obj, msg),
});

// echo <text>  -> replies with <text>
bot.use(/^echo\s+(.+)/i, (msg) => {
  const m = msg.text.match(/^echo\s+(.+)/i);
  return { text: m ? m[1] : "" };
});

// reverse <text> -> replies with reversed text
bot.use(/^reverse\s+(.+)/i, (msg) => {
  const m = msg.text.match(/^reverse\s+(.+)/i);
  const s = (m ? m[1] : "").split("").reverse().join("");
  return { text: s };
});

async function run() {
  const tests: Message[] = [
    { text: "echo hello world" },
    { text: "reverse abcdef" },
    { text: "unknown command" },
  ];

  for (const t of tests) {
    const replies = await bot.handle(t);
    for (const r of replies) {
      log.info({ in: t.text, out: r.text }, "bot reply");
    }
  }
}

run().catch((err) => {
  log.error({ err }, "bot demo failed");
  process.exitCode = 1;
});
