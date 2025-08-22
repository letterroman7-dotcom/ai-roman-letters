// src/bot/skills/ask.ts
// "ask" skill: normalizes the question safely under strict typing.

export const registerAsk = (bot: any): void => {
  bot.use(/^ask\s+(.+)/i, async (msg: any) => {
    const textRaw = typeof msg?.text === "string" ? msg.text : "";
    const m = textRaw.match(/^ask\s+(.+)/i);
    const q: string = (m?.[1] ?? "").trim().toLowerCase();

    if (!q) {
      // No-op or optionally return a help reply
      return { text: "Usage: ask <your question>" };
    }

    // TODO: plug in your real Q&A logic here
    return { text: `You asked: ${q}` };
  });
};

export default registerAsk;
