#!/usr/bin/env node
// scripts/prepush.cjs
const { spawnSync } = require("node:child_process");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

console.log('pre-push: running "npm run verify:all"...');
const res = spawnSync(npmCmd, ["run", "verify:all"], { stdio: "inherit" });
if ((res.status ?? 1) !== 0) {
  console.error("pre-push: verify:all failed — blocking push.");
  process.exit(res.status ?? 1);
}
console.log("pre-push: all checks passed — allowing push.");
