import process from "node:process";

import { runCli } from "./cli.js";

/**
 * Decide whether to start the HTTP server or run the CLI.
 * Explicit commands -> server; everything else (including no args) -> CLI.
 */
const SERVER_COMMANDS = new Set(["serve", "server", "start", "http"]);

function getMode(argv: string[]): "server" | "cli" {
  const first = (argv[0] ?? "").trim().toLowerCase();
  if (SERVER_COMMANDS.has(first)) return "server";
  return "cli";
}

(async () => {
  const argv = process.argv.slice(2);
  const mode = getMode(argv);

  if (mode === "server") {
    // Defer heavy server bootstrap until explicitly requested.
    await import("./bootstrap.js");
    return;
    // (server keeps running)
  }

  // Default to CLI mode — including when no args are provided.
  await runCli(argv);
})();
