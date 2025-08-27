// src/utils/json-store.ts
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export async function readJson<T = unknown>(
  file: string,
  fallback: T,
): Promise<T> {
  try {
    const data = await fsp.readFile(file, "utf8");
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  const dir = path.dirname(file);
  await fsp.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${Date.now()}.tmp`);
  const data = JSON.stringify(value, null, 2);
  await fsp.writeFile(tmp, data, "utf8");
  await fsp.rename(tmp, file);
}

export function readJsonSync<T = unknown>(file: string, fallback: T): T {
  try {
    const data = fs.readFileSync(file, "utf8");
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}
