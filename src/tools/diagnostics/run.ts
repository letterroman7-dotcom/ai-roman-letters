import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { inventoryRepo } from "./util.js";
import { buildDuplicatesReport, buildPolicyChecks } from "./checks.js";
import { buildDepsGraph } from "./deps.js";
import { runEslint } from "./eslint.js";
import { runTypecheck } from "./typecheck.js";

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
  if (chunkIdx >= 0 && args[chunkIdx + 1]) {
    const n = Number(args[chunkIdx + 1]);
    if (Number.isFinite(n) && n > 20 && n < 2000) opts.chunkLines = Math.floor(n);
  }
  const exclIdx = args.indexOf("--exclude");
  if (exclIdx >= 0 && args[exclIdx + 1]) {
    opts.excludes = args[exclIdx + 1].split(",").map((s) => s.trim()).filter(Boolean);
  }
  const rootIdx = args.indexOf("--root");
  if (rootIdx >= 0 && args[rootIdx + 1]) {
    opts.root = path.resolve(args[rootIdx + 1]);
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

  // 1) Inventory (files, sizes, hashes, optional content chunks)
  const inv = await inventoryRepo({
    root: opts.root,
    excludes: opts.excludes,
    includeContent: opts.includeContent,
    chunkLines: opts.chunkLines
  });
  await writeJSON(path.join(outDir, "inventory.json"), inv);

  // 2) Duplicates + simple policy checks
  const dup = buildDuplicatesReport(inv);
  await writeJSON(path.join(outDir, "duplicates.json"), dup);

  const policy = buildPolicyChecks(inv);
  await writeJSON(path.join(outDir, "policy.json"), policy);

  // 3) Deps graph (skip in quick mode)
  let deps: any = { nodes: [], edges: [] };
  if (!opts.quick) {
    deps = await buildDepsGraph(opts.root, inv);
    await writeJSON(path.join(outDir, "deps.json"), deps);
  }

  // 4) ESLint report (skip in quick mode)
  let lint: any = { summary: {}, results: [] };
  if (!opts.quick) {
    lint = await runEslint(inv.files.map((f) => f.pathAbs));
    await writeJSON(path.join(outDir, "eslint.json"), lint);
  }

  // 5) TypeScript type-check (skip in quick mode)
  let tsc: any = { ok: true, errors: [] };
  if (!opts.quick) {
    tsc = await runTypecheck(opts.root);
    await writeJSON(path.join(outDir, "typecheck.json"), tsc);
  }

  // 6) Summary markdown for human skim
  const md = [
    `# Diagnostics Summary (${stamp})`,
    ``,
    `**Root:** \`${opts.root}\`  `,
    `**Host:** \`${os.hostname()}\`  `,
    `**Include content:** ${opts.includeContent} (chunkLines=${opts.chunkLines})`,
    ``,
    `## Inventory`,
    `- Files scanned: **${inv.files.length}**`,
    `- Total size: **${(inv.totalBytes / 1024).toFixed(1)} KB**`,
    `- File types: ${Object.entries(inv.byExt).map(([k, v]) => `\`${k}\`(${v})`).join(", ")}`,
    ``,
    `## Duplicates`,
    `- Exact duplicates (by SHA-256): **${dup.groups.length} groups**`,
    `- Normalized duplicates (whitespace/comments stripped): **${dup.normalizedGroups.length} groups**`,
    ``,
    `## Policy checks`,
    `- Missing .js extension in relative imports (ESM NodeNext): **${policy.imports.missingJsExtension.length}**`,
    `- Duplicate file names (different folders): **${policy.duplicates.sameName.length}**`,
    ``,
    `## Deps graph`,
    `- Nodes: **${deps.nodes?.length ?? 0}**, Edges: **${deps.edges?.length ?? 0}**`,
    ``,
    `## ESLint`,
    `- Files with problems: **${lint.summary?.errorCount ?? 0 + lint.summary?.warningCount ?? 0}**`,
    `- Errors: **${lint.summary?.errorCount ?? 0}**, Warnings: **${lint.summary?.warningCount ?? 0}**`,
    ``,
    `## TypeScript`,
    `- Typecheck OK: **${tsc.ok}**`,
    `- Errors: **${tsc.errors?.length ?? 0}**`,
    ``,
    `> Detailed JSON files are in \`data/diagnostics/${stamp}/\`. Paste any of them to me for deep refactor/cleanup help.`,
    ``
  ].join("\n");
  await writeMD(path.join(outDir, "summary.md"), md);

  // 7) Write index pointer & console success
  await writeJSON(path.join(opts.root, "data", "diagnostics", "latest.json"), {
    stamp,
    outDir
  });

  console.log(`\n✅ Diagnostics complete → ${outDir}\n`);
}

main().catch((err) => {
  console.error("Diagnostics failed:", err);
  process.exitCode = 1;
});
