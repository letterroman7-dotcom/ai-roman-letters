// test/bot.cli-negative.test.mjs
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const nodeBin = process.execPath;
const cli = path.resolve(process.cwd(), "dist", "cli.js");

function parseArrayFromStdout(stdout) {
  const matches = stdout.match(/\[[\s\S]*?\]/g);
  if (!matches || matches.length === 0) {
    throw new Error(`No JSON array found in CLI output:\n${stdout}`);
  }
  return JSON.parse(matches[matches.length - 1]);
}

async function send(message) {
  const { stdout } = await execFileP(nodeBin, [cli, "bot:send", message], {
    env: { ...process.env, LOG_LEVEL: "fatal" },
    windowsHide: true,
  });
  return parseArrayFromStdout(stdout);
}

test("blank input -> no reply", async () => {
  const out = await send("");
  assert.deepEqual(out, []);
});

test("command requires argument -> echo with no arg yields no reply", async () => {
  const out = await send("echo");
  assert.deepEqual(out, []);
});

test("non-matching input -> no reply", async () => {
  const out = await send("unknown command");
  assert.deepEqual(out, []);
});
