// scripts/demo.mjs
// Runs three demo messages by spawning the compiled CLI with proper argv arrays.
// This avoids all Windows CMD quoting issues so messages don't arrive with literal quotes.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileP = promisify(execFile);
const NODE = process.execPath;
const CLI = path.resolve(process.cwd(), "dist", "cli.js");

function parseArrayFromStdout(stdout) {
  // The CLI logs JSON objects for telemetry and prints the bot's reply as a JSON array.
  // Grab the last JSON array from stdout.
  const matches = stdout.match(/\[[\s\S]*?\]/g);
  if (!matches || matches.length === 0) {
    throw new Error(`No JSON array found in CLI output:\n${stdout}`);
  }
  return JSON.parse(matches[matches.length - 1]);
}

async function send(message, { quiet = true } = {}) {
  const { stdout } = await execFileP(NODE, [CLI, "bot:send", message], {
    env: {
      ...process.env,
      LOG_LEVEL: quiet ? "fatal" : (process.env.LOG_LEVEL ?? "info"),
    },
    windowsHide: true,
  });
  const arr = parseArrayFromStdout(stdout);
  // Print just the reply array so this script is easy to eyeball / pipe.
  console.log(JSON.stringify(arr, null, 2));
}

await send("echo hello world");
await send("reverse tacos");
await send("ask Why Is The Sky Blue?");
