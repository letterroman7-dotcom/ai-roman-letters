// src/diagnostics/helpers/env.ts
// Robust .env parser compatible with strict TS.

import fs from "node:fs";

export function parseDotEnv(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return out;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  // KEY=VALUE   (allows empty value)
  const pat = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/;

  for (const raw of lines) {
    if (!raw) continue;
    if (raw.trim().startsWith("#")) continue;

    const m = raw.match(pat);
    if (!m) continue;

    const key = m[1];
    if (!key) continue;

    let val = (m[2] ?? "").trim();

    // Strip matching quotes
    if (
      val.length >= 2 &&
      ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'")))
    ) {
      val = val.slice(1, -1);
    }

    // Unescape common sequences
    val = val.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");

    out[key] = val;
  }

  return out;
}
