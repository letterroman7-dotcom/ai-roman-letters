// src/cli.ts
import pino from "pino";
import { basename } from "node:path";
import registerGuardian from "./modules/guardian/index.js";
import registerBot from "./modules/bot/index.js";

type CommandHandler = (args: unknown[]) => Promise<any> | any;

class App {
  public log: any;
  private _commands = new Map<string, CommandHandler>();

  public env: string;
  public name: string;

  constructor(log: any) {
    this.log = log;
    this.env = process.env.NODE_ENV ?? "development";
    this.name = "ai-bot";
  }
  registerCommand(name: string, fn: CommandHandler) {
    this._commands.set(name, fn);
  }
  listCommands(): string[] {
    return Array.from(this._commands.keys()).sort();
  }
  async runCommand(name: string, args: unknown[] = []) {
    const fn = this._commands.get(name);
    if (!fn) throw new Error(`Unknown command: ${name}`);
    return await fn(args);
  }
}

async function buildApp() {
  const devPretty =
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined;
  const log = pino({ name: "ai-bot", level: "info", transport: devPretty });

  const app = new App(log);

  // health
  app.registerCommand("health", async () => ({ ok: true, ts: new Date().toISOString() }));
  log.info("health module initialized");

  // guardian
  await registerGuardian(app as any);

  // bot
  await registerBot(app as any);

  return app;
}

async function run() {
  const app = await buildApp();

  const [, , cmd, ...rest] = process.argv;
  if (!cmd) {
    const exe = basename(process.argv[1] ?? "cli");
    console.log(`usage: npm run cli -- <command> [args...]

commands: ${app.listCommands().join(", ")}

examples:
  npm run cli -- health
  npm run cli -- panic:status
  npm run cli -- bot:send "echo hello world"
  npm run cli -- bot:demo
`);
    return;
  }

  try {
    const result = await app.runCommand(cmd, rest);
    if (typeof result === "string") {
      console.log(result);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err: any) {
    app.log.error({ err, cmd }, "Command failed");
    process.exitCode = 1;
  }
}

run();
