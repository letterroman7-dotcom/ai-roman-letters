import fs from "node:fs/promises";
import path from "node:path";

/** Ensure a directory exists (mkdir -p). Returns the absolute path. */
export async function ensureDir(dirPath: string): Promise<string> {
  const abs = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath);
  await fs.mkdir(abs, { recursive: true });
  return abs;
}
