import { promises as fs } from "node:fs";
import path from "node:path";

export function resolvePanicPath(base?: string) {
  const cwd = base ?? process.cwd();
  return path.resolve(cwd, "data", "guardian", "panic.lock");
}

export async function getPanic(panicLockPath = resolvePanicPath()) {
  try {
    await fs.access(panicLockPath);
    return true;
  } catch {
    return false;
  }
}

export async function setPanic(on: boolean, panicLockPath = resolvePanicPath()) {
  const dir = path.dirname(panicLockPath);
  await fs.mkdir(dir, { recursive: true });
  if (on) {
    await fs.writeFile(panicLockPath, String(Date.now()), "utf8");
  } else {
    try {
      await fs.unlink(panicLockPath);
    } catch {
      /* ignore if not present */
    }
  }
  return on;
}
