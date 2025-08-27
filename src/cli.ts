// src/cli.ts
// --- lightweight --help shim (keeps existing CLI behavior intact) ---
const __args = process.argv.slice(2);
if (__args.length === 0 || __args.includes("--help") || __args.includes("-h") || __args[0] === "help") {
   
  console.log(
    [
      "A`I Bot CLI",
      "",
      "Usage:",
      "  node dist/src/cli.js help",
      "  node dist/src/cli.js ping",
      "  node dist/src/cli.js antinuke status",
      "  node dist/src/cli.js antinuke simulate <eventType> <count>",
      "",
      "Examples:",
      "  node dist/src/cli.js antinuke simulate channelDelete 2",
      "  node dist/src/cli.js antinuke status",
    ].join("\n"),
  );
  process.exit(0);
}
// -

import os from "node:os";

import { kv as storageKV } from "./storage/index.js"; // optional persistence

type Snapshot = Record<string, number>;
type AntiNukeTuning = { windowMs: number; scorePerEvent: number; threshold: number };

const TUNING: AntiNukeTuning = { windowMs: 30_000, scorePerEvent: 0.5, threshold: 1 };

// Fallback in-memory snapshot if storage not configured/available
const mem = { snapshot: {} as Snapshot };

async function loadSnapshot(): Promise<Snapshot> {
  try {
    const s = await storageKV.get<Snapshot>("antinuke:snapshot");
    return s ?? {};
  } catch {
    return mem.snapshot;
  }
}

async function saveSnapshot(s: Snapshot): Promise<void> {
  try {
    await storageKV.set("antinuke:snapshot", s);
  } catch {
    mem.snapshot = s;
  }
}

async function cmdPing() {
   
  console.log(`pong | Node: ${process.version} (${os.platform()}/${os.arch()})`);
}

function scoreFromSnapshot(s: Snapshot): number {
  const totalEvents = Object.values(s).reduce((a, b) => a + b, 0);
  return Number((totalEvents * TUNING.scorePerEvent).toFixed(2));
}

async function antinukeStatus() {
  const snapshot = await loadSnapshot();
  const score = scoreFromSnapshot(snapshot);
  const triggered = score >= TUNING.threshold;
   
  console.log(
    "AntiNuke status:",
    JSON.stringify(
      { snapshot, score, triggered, tuning: TUNING },
      null,
      2,
    ),
  );
}

async function antinukeSimulate(eventType: string, countStr: string) {
  const count = Math.max(1, Number(countStr) || 1);
  const snapshot = await loadSnapshot();
  snapshot[eventType] = (snapshot[eventType] || 0) + count;
  await saveSnapshot(snapshot);
  const score = scoreFromSnapshot(snapshot);
  const triggered = score >= TUNING.threshold;
   
  console.log(`Simulated ${eventType} x${count}`);
   
  console.log(
    JSON.stringify(
      { snapshot, score, triggered, tuning: TUNING },
      null,
      2,
    ),
  );
}

async function main(argv: string[]) {
  const [cmd, sub, a1, a2] = argv;

  if (cmd === "ping") return cmdPing();

  if (cmd === "antinuke") {
    if (sub === "status") return antinukeStatus();
    if (sub === "simulate" && a1) return antinukeSimulate(a1, a2 ?? "1");
  }

  // default fallthrough (already handled help above)
  return cmdPing();
}

await main(process.argv.slice(2));
