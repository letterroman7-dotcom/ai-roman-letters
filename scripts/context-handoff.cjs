#!/usr/bin/env node
/* scripts/context-handoff.cjs */
"use strict";

// import/order: fs → os → path to satisfy your ruleset
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

try {
  require("dotenv").config();
} catch {}

const nowIso = new Date().toISOString();
const cwd = process.cwd();

const distIndex = path.join(cwd, "dist", "index.js");
const bootstrap = path.join(cwd, "dist", "bootstrap.js");
const diagQuick = path.join(cwd, "dist", "diagnostics", "quick.js");
const diagFull = path.join(cwd, "dist", "diagnostics", "full.js");

const existence = {
  env: fs.existsSync(path.join(cwd, ".env")),
  envExample: fs.existsSync(path.join(cwd, ".env.example")),
  distIndex: fs.existsSync(distIndex),
  panicLockFile: fs.existsSync(
    path.join(cwd, "data", "guardian", "panic.lock"),
  ),
};

let packageJson = null;
let packageJsonError = null;
try {
  packageJson = JSON.parse(
    fs.readFileSync(path.join(cwd, "package.json"), "utf8"),
  );
} catch (e) {
  packageJsonError = String((e && e.message) || e);
}

const snapshot = {
  when: nowIso,
  system: {
    node: process.version,
    npm: process.env.npm_config_user_agent
      ? process.env.npm_config_user_agent.split(" ")[0]?.split("/")?.[1]
      : process.env.npm_version || null,
    os: `${os.platform()} ${os.arch()}`,
    release: os.release(),
  },
  paths: { cwd, distIndex, bootstrap, diagQuick, diagFull },
  existence,
  env: {
    APP_NAME: process.env.APP_NAME || null,
    NODE_ENV: process.env.NODE_ENV || null,
  },
  packageJson,
  packageJsonError,
};

const outDir = path.join(cwd, ".handoff");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "context.json");
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf8");

console.log("handoff written:", outPath);
console.log(
  "summary:\n",
  " node:",
  snapshot.system.node,
  "\n",
  " npm :",
  snapshot.system.npm || "unknown",
  "\n",
  " cwd :",
  cwd,
  "\n",
  " dist index present:",
  existence.distIndex,
);

// future-proof: keep linter happy even if placeholders appear
const _unused = null;
void _unused;
