// test/bot.cli.test.mjs
// Integration tests that drive the compiled CLI (dist/cli.js).
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const nodeBin = process.execPath;
const cli = path.resolve(process.cwd(), "dist", "cli.js");

function parseArrayFromStdout(stdout) {
  // CLI logs JSON objects; replies are emitted as a JSON array. Take the last array.
  const matches = stdout.match(/\[[\s\S]*?\]/g);
  if (!matches || matches.length === 0) {
    throw new Error(`No JSON array found in CLI output:\n${stdout}`);
  }
  return JSON.parse(matches[matches.length - 1]);
}

async function send(message) {
  const { stdout } = await execFileP(nodeBin, [cli, "bot:send", message], {
    env: { ...process.env, LOG_LEVEL: "fatal" }, // quiet logs in tests
    windowsHide: true,
  });
  return parseArrayFromStdout(stdout);
}

test("echo -> echoes trailing text", async () => {
  const out = await send("echo hello world");
  assert.deepEqual(out, ["hello world"]);
});

test("reverse -> reverses trailing text", async () => {
  const out = await send("reverse tacos");
  assert.deepEqual(out, ["socat"]);
});

test("ask -> normalizes to lowercase and echoes question", async () => {
  const out = await send("ask Why Is The Sky Blue?");
  assert.deepEqual(out, ["You asked: why is the sky blue?"]);
});
