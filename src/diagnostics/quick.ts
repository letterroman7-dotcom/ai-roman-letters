import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function readJSON(p: string): any | null {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

const cwd = process.cwd();
const pkg = readJSON(path.join(cwd, "package.json"));
const panicPath = path.join(cwd, "data", "guardian", "panic.lock");
const distIndex = path.join(cwd, "dist", "index.js");

const info = {
  node: process.version,
  npm: (process.env.npm_config_user_agent?.match(/npm\/([0-9.]+)/)?.[1]) ?? null,
  os: `${os.platform()} ${os.release()}`,
  cwd,
  APP_NAME: process.env.APP_NAME ?? null,
  NODE_ENV: process.env.NODE_ENV ?? null,
  package: pkg ? `${pkg.name}@${pkg.version}` : null,
  distIndexPresent: fs.existsSync(distIndex),
  panic: fs.existsSync(panicPath) ? "ON" : "off"
};

const ok = info.distIndexPresent;
const mark = ok ? "✅" : "❌";

console.log(`${mark} diag:quick`, info);

// Non-zero exit if critical artifact missing (helps CI signal failures)
if (!ok) process.exitCode = 1;
