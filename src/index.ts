/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { initActionPipeline, enqueueAction } from "./core/action-pipeline.js";
import { listCommands, runCommand } from "./core/commands.js";
import { loadModules } from "./core/module-loader.js";
import { createQueue } from "./utils/action-queue.js";
import { auditEvent, beginIncident, endIncident } from "./utils/audit.js";
import config from "./utils/config.js";
import { killSwitchActive, listFlags } from "./utils/flags.js";
import logger from "./utils/logger.js";

/* ---------- Narrow external APIs so strict lint stops seeing `any/unknown` ---------- */
type CommandMeta = { name: string };

const Log = logger as unknown as {
  info: (bindings: Record<string, unknown>, msg?: string) => void;
  warn: (msg: string) => void;
};

const ListCommands = listCommands as unknown as () => CommandMeta[];
const RunCommand = runCommand as unknown as (name: string) => Promise<unknown>;
const EnqueueAction = enqueueAction as unknown as (
  evt: { type: string },
  handler: (ctx: { audit: (rec: { category: string; action: string }) => Promise<void> }) => Promise<boolean>
) => Promise<boolean>;
/* ------------------------------------------------------------------------------------ */

async function main(): Promise<void> {
  Log.info(
    { env: config.env, app: config.appName, logLevel: config.logLevel },
    "A`I project: booting…"
  );

  if (killSwitchActive()) {
    Log.warn("Global kill switch is ACTIVE — exiting cleanly.");
    return;
  }

  Log.info({ flags: Array.from(listFlags()) }, "Feature flags loaded");

  initActionPipeline();

  const incident = await beginIncident({ note: "Tier-0 bootstrap" });
  const queue = createQueue({ concurrency: 4, rateLimit: { max: 10, intervalMs: 1000 } });

  for (let i = 1; i <= 5; i++) {
    const jobNo = i;
    void queue.add(async () => {
      await new Promise((r) => setTimeout(r, 200 + jobNo * 50));
      await auditEvent({
        level: "info",
        category: "demo",
        action: "job_done",
        details: { jobNo }
      });
    }, `demo-${jobNo}`);
  }

  await queue.idle();
  await endIncident(incident, { status: "ok" });

  await loadModules();

  const cmds = ListCommands().map((c) => c.name);
  Log.info({ cmds }, "Commands available");

  const health: unknown = await RunCommand("health");
  Log.info({ health }, "Health command output");

  await EnqueueAction({ type: "noop" }, async ({ audit }) => {
    await audit({ category: "system", action: "noop" });
    return true;
  });

  Log.info({ queue: { size: queue.size(), pending: queue.pending() } }, "Bootstrap OK. Modules wired.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal boot error:", err);
  process.exitCode = 1;
});
