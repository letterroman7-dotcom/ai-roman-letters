import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type InvChunk = { startLine: number; text: string };

export type InvFile = {
  pathRel: string;
  pathAbs: string;
  size: number;
  mtimeMs: number;
  ext: string;
  sha256: string;
  sha256Normalized: string;
  lines: number;
  contentChunks?: InvChunk[];
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
        const ext = path.extname(e.name).toLowerCase();
        const stat = await fs.stat(full);

        const isBinary = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2"].includes(ext);
        const raw = isBinary ? null : await fs.readFile(full, "utf8").catch(() => null);

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

/** Strip // and /* *\/ comments and whitespace for normalized comparison. */
export function normalizeCode(s: string): string {
  if (!s) return "";
  let out = s.replace(/\/\/.*$/gm, "");
  out = out.replace(/\/\*[\s\S]*?\*\//g, "");
  out = out.replace(/\s+/g, "");
  return out;
}

export function chunkByLines(s: string, chunkLines = 300): InvChunk[] {
  const lines = s.split(/\r?\n/);
  const chunks: InvChunk[] = [];
  for (let i = 0; i < lines.length; i += chunkLines) {
    chunks.push({ startLine: i + 1, text: lines.slice(i, i + chunkLines).join("\n") });
  }
  return chunks;
}
