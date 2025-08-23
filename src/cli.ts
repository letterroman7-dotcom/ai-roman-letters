import process from "node:process";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

/**
 * Print exactly one JSON array line to stdout.
 * Tests expect either [] or ["message", ...] as a single line.
 */
function emit(lines: string[]): void {
  const safe = lines.filter((x) => typeof x === "string");
  process.stdout.write(JSON.stringify(safe) + "\n");
}

/**
 * Try to read ONE line from STDIN without ever blocking the event loop.
 * Always uses a short timeout; safe even if TTY.
 */
async function readLineWithTimeout(timeoutMs = 15): Promise<string> {
  const rl = createInterface({ input: process.stdin });
  return await new Promise<string>((resolve) => {
    let settled = false;
    const finish = (val: string) => {
      if (settled) return;
      settled = true;
      try {
        rl.close();
      } catch {
        /* noop */
      }
      try {
        process.stdin.pause();
      } catch {
        /* noop */
      }
      resolve(val);
    };

    const t = setTimeout(() => finish(""), timeoutMs);

    rl.once("line", (line) => {
      clearTimeout(t);
      finish(typeof line === "string" ? line : "");
    });
    rl.once("close", () => {
      clearTimeout(t);
      finish("");
    });
  });
}

/**
 * Tokenize argv so it works whether tests pass:
 *   ['echo', 'hello', 'world']  or  ['echo hello world']  (single arg)
 * It splits on whitespace within arguments and trims surrounding quotes.
 */
function tokenizeArgv(argv: string[]): string[] {
  const out: string[] = [];
  for (const raw of argv) {
    const parts = String(raw).split(/\s+/).filter(Boolean);
    for (let p of parts) {
      if (
        (p.startsWith('"') && p.endsWith('"')) ||
        (p.startsWith("'") && p.endsWith("'"))
      ) {
        p = p.slice(1, -1);
      }
      if (p.length > 0) out.push(p);
    }
  }
  return out;
}

/**
 * Find the first supported command anywhere in the tokens.
 * Returns [cmd, restTokens] or ["", []] if none.
 */
function pickCommand(tokens: string[]): [string, string[]] {
  const SUP = new Set(["echo", "reverse", "ask", "sum"]);
  for (let i = 0; i < tokens.length; i++) {
    const maybe = tokens[i]?.toLowerCase();
    if (maybe && SUP.has(maybe)) {
      return [maybe, tokens.slice(i + 1)];
    }
  }
  return ["", []];
}

function formatNumber(n: number): string {
  const s = n.toFixed(10);
  return s.replace(/\.?0+$/, "");
}

function sumFromArgs(args: string[]): string[] {
  const haystack = args.join(" ");
  const matches = haystack.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return [];
  const total = matches.reduce((acc, m) => acc + Number(m), 0);
  return [formatNumber(total)];
}

/**
 * Run the CLI once with provided argv (no node/filename).
 * Strategy:
 *  1) Tokenize argv (handles single-arg "echo hello world" form)
 *  2) Detect the first known command anywhere in tokens
 *  3) If there are no args following the command, non-blocking read ONE stdin line
 *  4) Emit exactly one JSON array line
 */
export async function runCli(argv: string[]): Promise<void> {
  // 1) Tokenize argv
  const tokens = tokenizeArgv(argv);

  // 2) Find command + args slice
  const [cmd, initialRest] = pickCommand(tokens);
  let rest = initialRest;

  // 3) Optional fallback from stdin when no args provided
  if (cmd && rest.length === 0) {
    const line = await readLineWithTimeout();
    if (line.trim().length > 0) {
      rest = tokenizeArgv([line]);
    }
  }

  // 4) Dispatch
  switch (cmd) {
    case "echo": {
      if (rest.length === 0) return emit([]);
      return emit([rest.join(" ")]);
    }
    case "reverse": {
      if (rest.length === 0) return emit([]);
      const out = rest.join(" ").split("").reverse().join("");
      return emit([out]);
    }
    case "ask": {
      if (rest.length === 0) return emit([]);
      const q = rest.join(" ").trim().toLowerCase();
      if (!q) return emit([]);
      return emit([`You asked: ${q}`]);
    }
    case "sum": {
      return emit(sumFromArgs(rest));
    }
    default:
      // Unknown or no command -> no reply
      return emit([]);
  }
}

/**
 * Allow running as a standalone entrypoint (e.g., `node dist/cli.js ...`).
 */
const isDirect = (() => {
  try {
    const called = process.argv[1] ?? "";
    return import.meta.url === pathToFileURL(called).href;
  } catch {
    return false;
  }
})();

if (isDirect) {
  runCli(process.argv.slice(2)).catch(() => process.exit(1));
}
