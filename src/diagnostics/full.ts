// src/diagnostics/full.ts
// Keep import/order happy: fs before os
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const _tsconfig = null as unknown;
void _tsconfig; // satisfy no-unused-vars

function safeReadJson(p: string) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

(function main() {
  const cwd = process.cwd();
  const snapshot = {
    node: process.version,
    npm: process.env.npm_version || null,
    os: `${os.platform()} ${os.release()}`,
    cwd,
    files: {
      distIndex: fs.existsSync(path.join(cwd, "dist", "index.js")),
      diagQuick: fs.existsSync(
        path.join(cwd, "dist", "diagnostics", "quick.js"),
      ),
      diagFull: fs.existsSync(path.join(cwd, "dist", "diagnostics", "full.js")),
    },
    env: {
      APP_NAME: process.env.APP_NAME || null,
      NODE_ENV: process.env.NODE_ENV || null,
    },
    pkg: safeReadJson(path.join(cwd, "package.json"))?.name ?? null,
  };
  console.log("✅ diag:full", JSON.stringify(snapshot, null, 2));
})();
