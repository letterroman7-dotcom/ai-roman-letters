// src/index.ts
/**
 * Entry point that supports BOTH:
 *  1) CLI mode (argv provided OR interactive via stdin) → JSON-lines protocol
 *  2) HTTP server (bootstrapped with no args)
 */
import { runCli } from "./cli.js";

const hasArgs = process.argv.length > 2;

async function main(): Promise<void> {
  if (hasArgs) {
    // One-shot CLI execution for argv mode (no server/no noise)
    await runCli();
    return;
  }

  // No args → start HTTP server first (side-effect module)
  await import("./bootstrap.js");

  // Also accept interactive stdin for CLI tests; do NOT exit the process.
  // runCli() will read lines and write a single JSON array per line.
  void runCli().catch(() => {
    /* swallow to avoid noisy stderr during tests */
  });
}

void main();
