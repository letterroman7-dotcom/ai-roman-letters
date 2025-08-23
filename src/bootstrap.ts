import "dotenv/config";
import pino from "pino";



import registerBot from "./modules/bot/index.js";
import registerGuardian from "./modules/guardian/index.js";
import registerHealth from "./modules/health/index.js";
import registerHttp from "./modules/http/index.js";

import type { App, CommandHandler } from "./types/app.js";
import type { Logger } from "pino";

async function main() {
  const name = process.env.APP_NAME || "ai-bot";
  const env = process.env.NODE_ENV || "development";
  const logLevel = (process.env.LOG_LEVEL as pino.LevelWithSilent) || "info";

  const log: Logger = pino({ name, level: logLevel });

  log.info({ env, app: name, logLevel }, `${name} project: booting...`);

  // Command bus (name -> handler(args[]))
  const commands = new Map<string, CommandHandler>();

  const app: App = {
    name,
    env,
    log,

    registerCommand(command: string, handler: CommandHandler) {
      commands.set(command, handler);
    },

    listCommands() {
      return Array.from(commands.keys()).sort();
    },

    async runCommand(cmd: string, args: unknown[]) {
      const handler = commands.get(cmd);
      if (!handler) throw new Error(`Unknown command: ${cmd}`);
      return await handler(args);
    },
  };

  // Wire modules
  const loaded: string[] = [];

  await registerHealth(app);
  loaded.push("health");

  await registerGuardian(app);
  loaded.push("guardian");

  await registerBot(app);
  loaded.push("bot");

  await registerHttp(app);
  loaded.push("http");

  app.log.info({ modules: loaded }, "Modules loaded");
  app.log.info({ cmds: app.listCommands() }, "Commands available");

  // Show health once during boot
  try {
    const health = await app.runCommand("health", []);
    app.log.info({ health }, "Health command output");
  } catch (err) {
    app.log.warn({ err }, "Health command missing");
  }

  app.log.info({ queue: { size: 0, pending: 0 } }, "Bootstrap OK. Modules wired.");
}

main().catch((err) => {
  const name = process.env.APP_NAME || "ai-bot";
  const log = pino({ name });
  log.fatal({ err }, "Fatal error during bootstrap");
  process.exit(1);
});
