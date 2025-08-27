// Tiny, runtime-agnostic "skill" contract.

export type Message = {
  text?: string; // many frameworks use .text
  content?: string; // discord-style uses .content
  reply?: (payload: string) => void | Promise<void>; // optional at runtime
};

export type Handler = (msg: Message) => void | Promise<void>;

export type BotLike = {
  use: (pattern: RegExp, handler: Handler) => void;
};

export function registerAsk(bot: BotLike): void {
  bot.use(/^\s*ask\b/i, async (msg) => {
    const raw = (msg.text ?? msg.content ?? "").trim();
    const m = raw.match(/^\s*ask\s+(.+)/i);
    const question = m?.[1]?.trim();

    const answer = question
      ? `You asked: ${question}`
      : "Usage: ask <your question>";

    await msg.reply?.(answer);
  });
}
