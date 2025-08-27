#!/usr/bin/env node
/* scripts/repo-inventory.cjs */
"use strict";

// Use CommonJS requires to avoid import-order lint on ESM imports in .cjs files
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const cwd = process.cwd();

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(path.relative(cwd, p));
  }
  return out;
}

const roots = ["src", "scripts", "dist", "test", "data"];
const files = roots.flatMap((r) => listFiles(path.join(cwd, r)));

const hash = crypto.createHash("sha256");
for (const f of files) hash.update(f);
const digest = hash.digest("hex").slice(0, 12);

const report = { cwd, count: files.length, digest, sample: files.slice(0, 10) };
console.log(JSON.stringify(report, null, 2));
