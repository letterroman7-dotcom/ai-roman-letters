import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type InvFile = {
  pathRel: string;
  pathAbs: string;
  size: number;
  mtimeMs: number;
  ext: string;
  sha256: string;
  sha256Normalized: string;
  lines: number;
  contentChunks?: string[]; // optional, only when includeContent=true
};

export type Inventory = {
  root: string;
  files: InvFile[];
  totalBytes: number;
  byExt: Record<string, number>;
};

export async function inventoryRepo(opts: {
  root: string;
  excludes: string[];
  includeContent: boolean;
  chunkLines: number;
}): Promise<Inventory> {
  const root = path.resolve(opts.root);
  const files: InvFile[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full);
      if (opts.excludes.some((ex) => rel === ex || rel.startsWith(ex + path.sep))) continue;
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile()) {
        // skip binary-ish by extension
        const ext = path.extname(e.name).toLowerCase();
        const stat = await fs.stat(full);
        const raw = await fs.readFile(full, ext === ".png" || ext === ".jpg" || ext === ".webp" ? undefined : "utf8").catch(() => null);

        const content = typeof raw === "string" ? raw : "";
        const normalized = normalizeCode(content);
        const sha256 = hash(content);
        const sha256Normalized = hash(normalized);
        const lines = content ? content.split(/\r?\n/).length : 0;

        const inv: InvFile = {
          pathRel: rel.replace(/\\/g, "/"),
          pathAbs: full,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
          ext: ext || "noext",
          sha256,
          sha256Normalized,
          lines
        };

        if (opts.includeContent && content) {
          inv.contentChunks = chunkByLines(content, opts.chunkLines);
        }

        files.push(inv);
      }
    }
  }
  await walk(root);
  const byExt: Record<string, number> = {};
  for (const f of files) byExt[f.ext] = (byExt[f.ext] ?? 0) + 1;
  const totalBytes = files.reduce((a, f) => a + f.size, 0);
  return { root, files, totalBytes, byExt };
}

export function hash(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Very simple normalization: strip // and /* *\/ comments and whitespace */
export function normalizeCode(s: string): string {
  if (!s) return "";
  let out = s.replace(/\/\/.*$/gm, ""); // line comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, ""); // block comments
  out = out.replace(/\s+/g, ""); // all whitespace
  return out;
}

export function chunkByLines(s: string, chunkLines = 300): string[] {
  const lines = s.split(/\r?\n/);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += chunkLines) {
    chunks.push(lines.slice(i, i + chunkLines).join("\n"));
  }
  return chunks;
}
