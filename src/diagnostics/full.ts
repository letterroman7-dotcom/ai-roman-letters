import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const requireCjs = createRequire(import.meta.url);

type Json = Record<string, any> | null;

function readJSONSafe(p: string): Json {
  // 1) Try requiring JSON (handles BOM and is tolerant)
  try {
    return requireCjs(p);
  } catch {}
  // 2) Fallback to fs + JSON.parse with BOM strip
  try {
    let raw = fs.readFileSync(p, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // strip BOM
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function exists(p: string) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}
function getGitRef(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}
function getNpmVersion(): string | null {
  try {
    return execSync("npm -v", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}
function semverMajor(v: string | null): number | null {
  if (!v) return null;
  const m = v.replace(/^v/, "").match(/^(\d+)\./);
  return m ? Number(m[1]) : null;
}

const cwd = process.cwd();
const pkgPath = path.join(cwd, "package.json");
const tsconfigPath = path.join(cwd, "tsconfig.json");
const envPath = path.join(cwd, ".env");

const pkg = readJSONSafe(pkgPath);
const tsconfig = readJSONSafe(tsconfigPath);

const paths = {
  cwd,
  distIndex: path.join(cwd, "dist", "index.js"),
  distBootstrap: path.join(cwd, "dist", "bootstrap.js"),
  diagQuick: path.join(cwd, "dist", "diagnostics", "quick.js"),
  diagFull: path.join(cwd, "dist", "diagnostics", "full.js"),
  editorconfig: path.join(cwd, ".editorconfig"),
  vscodeSettings: path.join(cwd, ".vscode", "settings.json"),
  ciWorkflow: path.join(cwd, ".github", "workflows", "ci.yml"),
  panicLock: path.join(cwd, "data", "guardian", "panic.lock"),
};

const info = {
  node: process.version,
  npm: getNpmVersion(),
  os: `${os.platform()} ${os.release()}`,
  git: getGitRef(),
  package: pkg ? `${pkg.name}@${pkg.version}` : null,
  moduleType: pkg?.type ?? null,
  env: {
    APP_NAME: process.env.APP_NAME ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
    LOG_LEVEL: process.env.LOG_LEVEL ?? null,
    PANIC_LOCK_FILE: process.env.PANIC_LOCK_FILE ?? null,
  },
  artifacts: {
    distIndex: exists(paths.distIndex),
    distBootstrap: exists(paths.distBootstrap),
    diagQuick: exists(paths.diagQuick),
    diagFull: exists(paths.diagFull),
  },
  workspace: {
    editorconfig: exists(paths.editorconfig),
    vscodeSettings: exists(paths.vscodeSettings),
    ciWorkflow: exists(paths.ciWorkflow),
    tsconfig: exists(tsconfigPath),
    envFile: exists(envPath),
    gitRepo: exists(path.join(cwd, ".git")),
  },
};

const errors: string[] = [];
const warnings: string[] = [];
const notes: string[] = [];

// --- Hard checks
const nodeMajor = semverMajor(info.node);
if (nodeMajor !== null && nodeMajor < 20) {
  errors.push(
    `Node ${info.node} is too old; require >= 20.x (you have ${info.node}).`,
  );
}
if (!info.artifacts.distBootstrap || !info.artifacts.distIndex) {
  errors.push(
    "dist build incomplete: missing dist/bootstrap.js or dist/index.js. Run: npm run build",
  );
}
if (!pkg) {
  errors.push("package.json missing or invalid JSON.");
} else {
  // Scripts sanity only if we have pkg
  const expectedScripts = [
    "start",
    "build",
    "typecheck",
    "lint",
    "diag:quick",
    "diag:full",
    "handoff",
    "handoff:view",
  ];
  for (const s of expectedScripts) {
    if (!pkg.scripts?.[s]) warnings.push(`Missing npm script: "${s}".`);
  }
}

if (!info.workspace.envFile) {
  errors.push(".env file is missing at project root.");
} else {
  if (!info.env.APP_NAME) warnings.push("APP_NAME is not set in .env.");
  if (!info.env.NODE_ENV)
    warnings.push("NODE_ENV is not set in .env (development/production).");
}

// PANIC lock tip
const panicPath = info.env.PANIC_LOCK_FILE
  ? path.isAbsolute(info.env.PANIC_LOCK_FILE)
    ? info.env.PANIC_LOCK_FILE
    : path.join(cwd, info.env.PANIC_LOCK_FILE.replace(/^[.\\/]+/, ""))
  : paths.panicLock;

if (!exists(panicPath)) {
  warnings.push(`PANIC_LOCK_FILE points to missing file: ${panicPath}`);
} else {
  notes.push(`panic lock present at ${panicPath}`);
}

if (!info.workspace.editorconfig)
  warnings.push("Missing .editorconfig (ensure committed).");
if (!info.workspace.vscodeSettings)
  warnings.push("Missing .vscode/settings.json (ensure committed).");
if (!info.workspace.ciWorkflow)
  warnings.push("Missing .github/workflows/ci.yml (ensure committed).");
if (!info.workspace.tsconfig)
  warnings.push("Missing tsconfig.json (recommended).");

const ok = errors.length === 0;
const mark = ok ? "✅" : "❌";

const summary = {
  ok,
  errors,
  warnings,
  notes,
  info: {
    node: info.node,
    npm: info.npm,
    os: info.os,
    git: info.git,
    package: info.package,
    cwd: paths.cwd,
    env: info.env,
    artifacts: info.artifacts,
  },
};

console.log(`${mark} diag:full`);
console.log(JSON.stringify(summary, null, 2));

if (!ok) process.exitCode = 1;
