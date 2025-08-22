// src/diagnostics/helpers/fs.ts
// Small grep-like utility with strict guards.

import fs from "node:fs";

export function grepFile(
  file: string,
  pat: RegExp,
): Array<{ file: string; line: number; text: string; match: string }> {
  const results: Array<{
    file: string;
    line: number;
    text: string;
    match: string;
  }> = [];

  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;

    const m = line.match(pat);
    if (m && m[0] !== undefined) {
      results.push({ file, line: i + 1, text: line.trim(), match: m[0] });
    }
  }

  return results;
}
