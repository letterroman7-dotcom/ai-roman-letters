// src/cli.ts
/**
 * CLI that speaks a JSON-lines protocol:
 * - Each input line (or argv call) → exactly ONE JSON array on stdout.
 * - Commands: echo, reverse, ask, sum
 * - Also supports numeric fallback: if line has numbers but no known cmd, returns their sum.
 * - Accepts common command prefixes (! / . # > @) and can find a command in the first few tokens.
 */
import { stdin as input } from "node:process";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

const _exe = process.execPath;
void _exe; // satisfy no-unused-vars

const KNOWN = new Set(["echo", "reverse", "ask", "sum"]);

function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number) : [];
}

function normalizeCmdToken(token: string): string {
  // strip leading common bot prefixes
  return token.replace(/^[!\/.#>@]+/, "").toLowerCase();
}

function parseCommandAndText(line: string): {
  cmd: string | null;
  text: string;
} {
  const parts = line.trim().split(/\s+/);
  if (parts.length === 0) return { cmd: null, text: "" };

  // Scan first few tokens to find a known command after normalization
  const scanLimit = Math.min(parts.length, 3);
  for (let i = 0; i < scanLimit; i++) {
    const token = parts[i] ?? ""; // <-- safe default to satisfy TS
    const maybe = normalizeCmdToken(token);
    if (KNOWN.has(maybe)) {
      const text = parts.slice(i + 1).join(" ");
      return { cmd: maybe, text };
    }
  }
  return { cmd: null, text: line.trim() };
}

function handle(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const { cmd, text } = parseCommandAndText(trimmed);

  switch (cmd) {
    case "echo":
      return text ? [text] : [];
    case "reverse":
      return text ? [text.split("").reverse().join("")] : [];
    case "ask":
      return text ? [`You asked: ${text.toLowerCase()}`] : [];
    case "sum": {
      const nums = extractNumbers(text);
      if (nums.length === 0) return [];
      const total = nums.reduce((a, b) => a + b, 0);
      return [String(total)];
    }
    default: {
      // Fallback: sum any numbers present in the whole input line
      const nums = extractNumbers(trimmed);
      if (nums.length > 0) {
        const total = nums.reduce((a, b) => a + b, 0);
        return [String(total)];
      }
      return [];
    }
  }
}

export async function runCli(): Promise<void> {
  // argv mode: one shot, then exit
  const argLine = process.argv.slice(2).join(" ").trim();
  if (argLine) {
    const out = handle(argLine);
    process.stdout.write(JSON.stringify(out) + "\n");
    return;
  }

  // interactive stdin mode: one JSON line per input line (no prompts)
  const rl = createInterface({ input, crlfDelay: Infinity });
  for await (const raw of rl) {
    const out = handle(String(raw));
    process.stdout.write(JSON.stringify(out) + "\n");
  }
}

// Cross-platform “run if main” (Windows-friendly)
try {
  const mainHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
  if (import.meta.url === mainHref) {
    runCli().catch(() => process.exit(1));
  }
} catch {
  // ignore
}
