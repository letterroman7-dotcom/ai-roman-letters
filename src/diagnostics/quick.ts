// src/diagnostics/quick.ts
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { readDotEnv, summarizeAppNames } from "./helpers/env.js";
import { pathExists, safeReadJson } from "./helpers/fs.js";

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const cwd = process.cwd();

  const when = new Date().toISOString();
  let npm = "";
  try { npm = execSync("npm -v").toString().trim(); } catch { npm = ""; }

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

  const out = {
    when,
    system: {
      node: process.version,
      npm,
      os: `${process.platform} ${process.arch}`,
      release: os.release(),
    },
    appNameSummary,
    paths,
    existence,
    packageJson,
    packageLockJson,
  };

  // write to logs + also print to console
  const logsDir = path.join(cwd, "data", "logs");
  const file = path.join(
    logsDir,
    `${when.replace(/[:.]/g, "-")}-quick.json`
  );
  await ensureDir(logsDir);
  await fs.writeFile(file, JSON.stringify(out, null, 2), "utf8");

  // guaranteed visible line + JSON body
  console.log(`DIAG[quick]: wrote ${path.relative(cwd, file)}`);
  console.log(JSON.stringify(out, null, 2));
}

main().catch(err => {
  console.error("[diagnostics:quick] error:", err);
  process.exit(1);
});
