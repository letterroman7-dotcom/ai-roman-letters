import type { Logger } from "pino";

export type CommandHandler = (args: unknown[]) => Promise<unknown> | unknown;

export interface App {
  name: string;
  env: string;
  log: Logger;

  registerCommand: (name: string, h: CommandHandler) => void;
  listCommands: () => string[];
  // NOTE: Single args array (matches your repo’s type contract)
  runCommand: (name: string, args: unknown[]) => Promise<unknown>;
}
