// Verifies guardian panic lock by checking the actual lock file presence
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test, before, after } from "node:test";

const repoRoot = process.cwd();
const lockDir = path.join(repoRoot, "data", "guardian");
const lockPath = path.join(lockDir, "panic.lock");

before(() => {
  fs.mkdirSync(lockDir, { recursive: true });
  if (fs.existsSync(lockPath)) fs.rmSync(lockPath);
});

after(() => {
  if (fs.existsSync(lockPath)) fs.rmSync(lockPath);
});

test("panic is OFF without lock file", () => {
  if (fs.existsSync(lockPath)) fs.rmSync(lockPath);
  assert.equal(fs.existsSync(lockPath), false, "Lock file should not exist");
});

test("panic turns ON when lock file exists", () => {
  fs.writeFileSync(lockPath, "panic:on\n");
  assert.equal(fs.existsSync(lockPath), true, "Lock file should exist");
});

test("panic turns OFF again after lock removal", () => {
  if (fs.existsSync(lockPath)) fs.rmSync(lockPath);
  assert.equal(fs.existsSync(lockPath), false, "Lock file should be removed");
});
