// src/core/commands.ts
export type CommandHandler = (args: unknown[]) => Promise<unknown> | unknown;

export class CommandRegistry {
  private map = new Map<string, CommandHandler>();

  register(name: string, h: CommandHandler) {
    if (!name || typeof h !== "function")
      throw new Error("Invalid command registration");
    this.map.set(name, h);
  }

  list(): string[] {
    return Array.from(this.map.keys()).sort();
  }

  async run(name: string, args: unknown[]): Promise<unknown> {
    const h = this.map.get(name);
    if (!h) throw new Error(`Unknown command: ${name}`);
    return await h(args);
  }
}
