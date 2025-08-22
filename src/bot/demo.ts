// src/bot/demo.ts
// Demo handlers: echo and reverse
// Safe for strict TS + noUncheckedIndexedAccess and your bot.use signature.

export const registerDemo = (bot: any): void => {
  // echo: replies with whatever follows "echo "
  bot.use(/^echo\s+(.+)/i, (msg: any) => {
    const textRaw = typeof msg?.text === "string" ? msg.text : "";
    const m = textRaw.match(/^echo\s+(.+)/i);
    const text: string = m?.[1] ?? "";
    return { text };
  });

  // reverse: replies with reversed text after "reverse "
  bot.use(/^reverse\s+(.+)/i, (msg: any) => {
    const textRaw = typeof msg?.text === "string" ? msg.text : "";
    const m = textRaw.match(/^reverse\s+(.+)/i);
    const s: string = (m?.[1] ?? "").split("").reverse().join("");
    return { text: s };
  });
};

export default registerDemo;
