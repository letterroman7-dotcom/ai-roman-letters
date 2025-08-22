import { promises as fs } from "node:fs";
import path from "node:path";

export async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function safeReadJson(p: string): Promise<any> {
  try {
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function listFiles(root: string, exts: string[], out: string[] = []): Promise<string[]> {
  let entries: any[] = [];
  try { entries = await fs.readdir(root, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.isDirectory()) {
      await listFiles(full, exts, out);
    } else if (exts.includes(path.extname(e.name))) {
      out.push(full);
    }
  }
  return out;
}

export async function grep(
  patterns: RegExp[],
  opts: { roots: string[]; exts: string[] }
): Promise<Array<{ file: string; line: number; text: string; match: string }>> {
  const results: Array<{ file: string; line: number; text: string; match: string }> = [];
  for (const root of opts.roots) {
    if (!(await pathExists(root))) continue;
    const files = await listFiles(root, opts.exts);
    for (const file of files) {
      let content = "";
      try { content = await fs.readFile(file, "utf8"); } catch { continue; }
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pat of patterns) {
          const m = line.match(pat);
          if (m) {
            results.push({ file, line: i + 1, text: line.trim(), match: m[0] });
            break;
          }
        }
      }
    }
  }
  return results;
}
