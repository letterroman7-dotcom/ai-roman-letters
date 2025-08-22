// src/diagnostics/full.ts
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { readDotEnv, summarizeAppNames } from "./helpers/env.js";
import { grep, pathExists, safeReadJson } from "./helpers/fs.js";

function sh(cmd: string): string {
  try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
  catch { return ""; }
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const cwd = process.cwd();

  const when = new Date().toISOString();
  const node = process.version;
  const npm = sh("npm -v");

  const git = {
    branch: sh("git rev-parse --abbrev-ref HEAD"),
    commit: sh("git rev-parse --short HEAD"),
    status: sh("git status --porcelain -uno"),
    remotes: sh("git remote -v"),
  };

  const envInfo = await readDotEnv(cwd);
  const appNameSummary = await summarizeAppNames(cwd);

  const paths = {
    cwd,
    panicLock: path.join(cwd, "data", "guardian", "panic.lock"),
    distIndex: path.join(cwd, "dist", "index.js"),
  };

  const existence = {
    env: envInfo.env.exists,
    envExample: envInfo.example.exists,
    distIndex: await pathExists(paths.distIndex),
    panicLockFile: await pathExists(paths.panicLock),
  };

  const packageJson = await safeReadJson(path.join(cwd, "package.json"));
  const packageLockJson = await safeReadJson(path.join(cwd, "package-lock.json"));

  // scan for legacy/garbled app names and weird ellipsis encoding
  const weirdNameHits = await grep(
    [
      /A`I/i,
      /A[`´’]I/i,
      /A.?I Bot/i,
      /APP_NAME/i,
      /PROJECT_NAME/i,
      /booting.?Γ/i // garbled ellipsis “ΓÇª”
    ],
    { roots: ["src", "dist"], exts: [".ts", ".js"] }
  );

  const out = {
    when,
    system: {
      node,
      npm,
      os: `${process.platform} ${process.arch}`,
      release: os.release(),
    },
    git,
    appNameSummary,
    paths,
    existence,
    packageJson,
    packageLockJson,
    scans: {
      weirdNames: weirdNameHits,
    },
  };

  // write to logs + also print to console
  const logsDir = path.join(cwd, "data", "logs");
  const file = path.join(
    logsDir,
    `${when.replace(/[:.]/g, "-")}-full.json`
  );
  await ensureDir(logsDir);
  await fs.writeFile(file, JSON.stringify(out, null, 2), "utf8");

  // guaranteed visible line + JSON body
  console.log(`DIAG[full]: wrote ${path.relative(cwd, file)}`);
  console.log(JSON.stringify(out, null, 2));
}

main().catch(err => {
  console.error("[diagnostics:full] error:", err);
  process.exit(1);
});
