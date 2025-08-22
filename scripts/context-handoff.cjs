"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const cp = require("child_process");

function safeExec(cmd) {
  try {
    const out = cp.execSync(cmd, { stdio: ["ignore","pipe","ignore"], timeout: 2000 });
    return String(out).trim();
  } catch {
    return null;
  }
}

const cwd = process.cwd();
const p = (...xs) => path.join(cwd, ...xs);

const ctx = {
  when: new Date().toISOString(),
  system: {
    node: process.version,
    npm: safeExec("npm -v"),
    os: `${os.platform()} ${os.arch()}`,
    release: os.release()
  },
  paths: {
    cwd,
    distIndex: fs.existsSync(p("dist","index.js")) ? p("dist","index.js") : null,
    bootstrap: fs.existsSync(p("dist","bootstrap.js")) ? p("dist","bootstrap.js") : null,
    diagQuick: fs.existsSync(p("dist","diagnostics","quick.js")) ? p("dist","diagnostics","quick.js") : null,
    diagFull: fs.existsSync(p("dist","diagnostics","full.js")) ? p("dist","diagnostics","full.js") : null
  },
  existence: {
    env: fs.existsSync(p(".env")),
    envExample: fs.existsSync(p(".env.example")),
    distIndex: fs.existsSync(p("dist","index.js")),
    panicLockFile: fs.existsSync(p("data","guardian","panic.lock"))
  },
  env: {
    APP_NAME: process.env.APP_NAME || null,
    NODE_ENV: process.env.NODE_ENV || null
  },
  packageJson: null
};

try {
  const pkg = JSON.parse(fs.readFileSync(p("package.json"), "utf8"));
  ctx.packageJson = { name: pkg.name, version: pkg.version, scripts: pkg.scripts || {} };
} catch {}

fs.mkdirSync(p(".handoff"), { recursive: true });
const target = p(".handoff","context.json");
fs.writeFileSync(target, JSON.stringify(ctx, null, 2), "utf8");

console.log("handoff written:", target);
console.log("summary:");
console.log("  node:", ctx.system.node);
console.log("  npm :", ctx.system.npm);
console.log("  cwd :", ctx.paths.cwd);
console.log("  dist index present:", ctx.existence.distIndex);
