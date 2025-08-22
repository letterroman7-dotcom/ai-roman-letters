// test/sum.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI = join(__dirname, "..", "dist", "cli.js");

function parseLastJsonArray(stdout) {
  // Be resilient to logger lines; grab the LAST JSON array in stdout.
  const matches = stdout.match(/\[[\s\S]*?\]/g);
  if (!matches || matches.length === 0) {
    throw new Error(`Unexpected CLI output:\n${stdout}`);
  }
  return JSON.parse(matches[matches.length - 1]);
}

function sendCli(text) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [CLI, "bot:send", text],
      // Still set LOG_LEVEL=fatal, but parse defensively in case logs appear.
      { env: { ...process.env, LOG_LEVEL: "fatal" } },
      (err, stdout, stderr) => {
        if (err) return reject(err);
        try {
          const arr = parseLastJsonArray(stdout);
          resolve(arr);
        } catch (e) {
          reject(new Error(`Unexpected CLI output:\n${stdout}\n${stderr}`));
        }
      },
    );
  });
}

test("sum -> sums integers", async () => {
  const out = await sendCli("sum 4 5");
  assert.deepEqual(out, ["9"]);
});

test("sum -> handles negatives and decimals", async () => {
  const out = await sendCli("sum -1 3.5 2");
  assert.deepEqual(out, ["4.5"]);
});

test("sum -> commas and spaces", async () => {
  const out = await sendCli("sum 1, 2, 3");
  assert.deepEqual(out, ["6"]);
});

test("sum -> no valid numbers yields no reply", async () => {
  const out = await sendCli("sum foo, bar");
  assert.deepEqual(out, []);
});
