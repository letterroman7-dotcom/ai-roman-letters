import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { buildDuplicatesReport, buildPolicyChecks } from "./checks.js";
import { buildDepsGraph, findDeadFiles } from "./deps.js";
import { runEslint } from "./eslint.js";
import { runTypecheck } from "./typecheck.js";
import { inventoryRepo } from "./util.js";

type CLIOpts = {
  root: string;
  includeContent: boolean;
  chunkLines: number;
  quick: boolean;
  excludes: string[];
};

function parseArgs(): CLIOpts {
  const args = process.argv.slice(2);
  const opts: CLIOpts = {
    root: process.cwd(),
    includeContent: args.includes("--content"),
    chunkLines: 300,
    quick: args.includes("--quick"),
    excludes: ["node_modules", "dist", ".git", ".turbo"]
  };

  const chunkIdx = args.indexOf("--chunks");
  if (chunkIdx >= 0) {
    const val = args[chunkIdx + 1];
    if (typeof val === "string") {
      const n = Number(val);
      if (Number.isFinite(n) && n > 20 && n < 2000) opts.chunkLines = Math.floor(n);
    }
  }

  const exclIdx = args.indexOf("--exclude");
  if (exclIdx >= 0) {
    const val = args[exclIdx + 1];
    if (typeof val === "string") {
      opts.excludes = val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const rootIdx = args.indexOf("--root");
  if (rootIdx >= 0) {
    const val = args[rootIdx + 1];
    if (typeof val === "string") {
      opts.root = path.resolve(val);
    }
  }

  return opts;
}

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeJSON(file: string, data: unknown) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function writeMD(file: string, md: string) {
  await fs.writeFile(file, md, "utf8");
}

async function main() {
  const opts = parseArgs();
  const stamp = nowStamp();
  const outDir = path.join(opts.root, "data", "diagnostics", stamp);
  await ensureDir(outDir);

  const inv = await inventoryRepo({
    root: opts.root,
    excludes: opts.excludes,
    includeContent: opts.includeContent,
    chunkLines: opts.chunkLines
  });
  await writeJSON(path.join(outDir, "inventory.json"), inv);

  const dup = buildDuplicatesReport(inv);
  await writeJSON(path.join(outDir, "duplicates.json"), dup);

  const policy = buildPolicyChecks(inv);
  await writeJSON(path.join(outDir, "policy.json"), policy);

  let deps: any = { nodes: [], edges: [] };
  let dead: string[] = [];
  if (!opts.quick) {
    deps = await buildDepsGraph(opts.root, inv);
    await writeJSON(path.join(outDir, "deps.json"), deps);

    const entry = path.join(opts.root, "src", "index.ts");
    const roots = inv.files.some((f) => path.resolve(f.pathAbs) === path.resolve(entry))
      ? [entry]
      : [];
    dead = findDeadFiles(deps, roots);
    await writeJSON(path.join(outDir, "dead.json"), { roots, files: dead });
  }

  let lint: any = { summary: {}, results: [] };
  if (!opts.quick) {
    lint = await runEslint(inv.files.map((f) => f.pathAbs));
    await writeJSON(path.join(outDir, "eslint.json"), lint);
  }

  let tsc: any = { ok: true, errors: [] };
  if (!opts.quick) {
    tsc = runTypecheck(opts.root);
    await writeJSON(path.join(outDir, "typecheck.json"), tsc);
  }

  const extList = Object.entries(inv.byExt)
    .map(([k, v]) => `${k}(${v})`)
    .join(", ");

  const missingExtLines = (policy.imports?.missingJsExtension ?? [])
    .slice(0, 10)
    .map((i: any) => `  - ${i.file}:${i.line} -> '${i.spec}'`)
    .join("\n");

  const deadPreview = dead
    .slice(0, 10)
    .map((f) => `  - ${path.relative(opts.root, f).replace(/\\/g, "/")}`)
    .join("\n");

  const md = [
    `# Diagnostics Summary (${stamp})`,
    ``,
    `Root: ${opts.root}`,
    `Host: ${os.hostname()}`,
    `Include content: ${opts.includeContent} (chunkLines=${opts.chunkLines})`,
    ``,
    `## Inventory`,
    `- Files scanned: ${inv.files.length}`,
    `- Total size: ${(inv.totalBytes / 1024).toFixed(1)} KB`,
    `- File types: ${extList}`,
    ``,
    `## Duplicates`,
    `- Exact duplicates: ${dup.groups.length} groups`,
    `- Normalized duplicates: ${dup.normalizedGroups.length} groups`,
    ``,
    `## Policy checks`,
    `- Missing .js extension (relative ESM imports): ${policy.imports.missingJsExtension.length}`,
    missingExtLines,
    ``,
    `## Dependency graph`,
    `- Nodes: ${deps.nodes?.length ?? 0}, Edges: ${deps.edges?.length ?? 0}`,
    ``,
    `## Dead files`,
    `- Count: ${dead.length}`,
    deadPreview,
    ``,
    `## ESLint`,
    `- Errors: ${lint.summary?.errorCount ?? 0}, Warnings: ${lint.summary?.warningCount ?? 0}`,
    ``,
    `## TypeScript`,
    `- Typecheck OK: ${tsc.ok}`,
    `- Errors: ${tsc.errors?.length ?? 0}`,
    ``,
    `Detailed reports are in data/diagnostics/${stamp}/`,
    ``
  ].join("\n");
  await writeMD(path.join(outDir, "summary.md"), md);

  await writeJSON(path.join(opts.root, "data", "diagnostics", "latest.json"), { stamp, outDir });

  console.log(`\n✅ Diagnostics complete → ${outDir}\n`);
}

main().catch((err) => {
  console.error("Diagnostics failed:", err);
  process.exitCode = 1;
});
