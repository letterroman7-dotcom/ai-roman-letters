// src/bot/core.ts
export type Message = { text: string };
export type Reply = { text: string };

export type Handler =
  | ((msg: Message) => void | Reply | Reply[] | Promise<void | Reply | Reply[]>);

type LogFn = (obj: Record<string, unknown>, msg: string) => void;

export class Bot {
  private handlers: { pattern: RegExp; handler: Handler }[] = [];
  private onLog?: LogFn;

  constructor(opts?: { onLog?: LogFn }) {
    this.onLog = opts?.onLog;
  }

  use(pattern: RegExp, handler: Handler) {
    this.handlers.push({ pattern, handler });
  }

  async handle(msg: Message): Promise<Reply[]> {
    const out: Reply[] = [];
    for (const { pattern, handler } of this.handlers) {
      if (!pattern.test(msg.text)) continue;
      const res = await handler(msg);
      if (Array.isArray(res)) {
        for (const r of res) if (r) out.push(r);
      } else if (res) {
        out.push(res);
      }
    }
    this.onLog?.({ in: msg.text, out: out.map((r) => r.text) }, "bot reply");
    return out;
  }
}
