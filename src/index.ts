// src/index.ts
// Entrypoint banner + current AntiNuke posture snapshot (persisted if configured).
import { kv as storageKV } from "./storage/index.js";

type Snapshot = Record<string, number>;
const TUNING = { windowMs: 30_000, scorePerEvent: 0.5, threshold: 1 };

async function loadSnapshot(): Promise<Snapshot> {
  try {
    return (await storageKV.get<Snapshot>("antinuke:snapshot")) ?? {};
  } catch {
    return {};
  }
}

function scoreFromSnapshot(s: Snapshot): number {
  const totalEvents = Object.values(s).reduce((a, b) => a + b, 0);
  return Number((totalEvents * TUNING.scorePerEvent).toFixed(2));
}

async function main() {
   
  console.log("[A`I] CLI ready. Try commands like:");
   
  console.log("  node dist/src/cli.js help");
   
  console.log("  node dist/src/cli.js antinuke status");
   
  console.log("  node dist/src/cli.js antinuke simulate roleDelete 3");

  const snapshot = await loadSnapshot();
  const score = scoreFromSnapshot(snapshot);
  const triggered = score >= TUNING.threshold;

   
  console.log(
    "AntiNuke status:",
    JSON.stringify({ snapshot, score, triggered, tuning: TUNING }, null, 2),
  );

  // If you later start the Discord client here, keep this banner, then boot the client.
}

main().catch((err) => {
   
  console.error(err);
  process.exit(1);
});
