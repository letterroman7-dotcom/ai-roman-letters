type Command = { name: string; run: () => Promise<unknown> };

const registry: Record<string, Command> = {
  health: {
    name: "health",
    async run() {
      return { ok: true, ts: new Date().toISOString() };
    }
  }
};

export function listCommands(): Command[] {
  return Object.values(registry);
}

export async function runCommand(name: string): Promise<unknown> {
  const cmd = registry[name];
  if (!cmd) throw new Error(`Command not found: ${name}`);
  return cmd.run();
}
