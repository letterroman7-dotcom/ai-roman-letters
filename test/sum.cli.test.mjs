// test/sum.cli.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

function extractLastJSONArray(text) {
  const start = text.lastIndexOf("[");
  if (start === -1) return "[]";
  const end = text.indexOf("]", start);
  if (end === -1) return "[]";
  return text.slice(start, end + 1);
}

function sendCli(cmd) {
  const out = execFileSync("node", ["./dist/cli.js", "bot:send", cmd], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const block = extractLastJSONArray(out);
  return JSON.parse(block);
}

test("sum -> sums integers", () => {
  assert.deepEqual(sendCli("sum 4 5"), ["9"]);
});

test("sum -> handles negatives and decimals", () => {
  assert.deepEqual(sendCli("sum -1 3.5 2"), ["4.5"]);
});

test("sum -> commas and spaces", () => {
  assert.deepEqual(sendCli("sum 1, 2, 3"), ["6"]);
});
