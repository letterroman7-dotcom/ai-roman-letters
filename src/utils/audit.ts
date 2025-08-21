import fs from "node:fs/promises";
import path from "node:path";

import config from "./config.js";
import { ensureDir } from "./fsx.js";
import { createId } from "./ids.js";
import logger from "./logger.js";

type Level = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface AuditInput {
  level?: Level;
  category: string;
  action: string;
  actorId?: string;
  targetId?: string;
  guildId?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
}

export interface AuditRecord extends Required<AuditInput> {
  id: string;
  ts: string;
}

function getLogFn(level: Level) {
  switch (level) {
    case "trace":
      return logger.trace.bind(logger);
    case "debug":
      return logger.debug.bind(logger);
    case "info":
      return logger.info.bind(logger);
    case "warn":
      return logger.warn.bind(logger);
    case "error":
      return logger.error.bind(logger);
    case "fatal":
      return logger.fatal.bind(logger);
    default:
      return logger.info.bind(logger);
  }
}

/** Append an audit record to console and (optionally) JSONL file. */
export async function auditEvent(input: AuditInput): Promise<string> {
  const rec: AuditRecord = {
    id: createId("evt"),
    ts: new Date().toISOString(),
    level: input.level ?? "info",
    category: input.category,
    action: input.action,
    actorId: input.actorId ?? "",
    targetId: input.targetId ?? "",
    guildId: input.guildId ?? "",
    correlationId: input.correlationId ?? "",
    details: input.details ?? {}
  };

  const log = getLogFn(rec.level);
  log({ audit: true, ...rec }, `[audit] ${rec.category}.${rec.action}`);

  if (config.auditToFile) {
    const dir = await ensureDir(config.auditDir);
    const day = rec.ts.slice(0, 10); // YYYY-MM-DD
    const file = path.join(dir, `${day}.jsonl`);
    const line = JSON.stringify(rec) + "\n";
    await fs.appendFile(file, line, "utf8");
  }

  return rec.id;
}

/** Begin an incident (returns correlation id). */
export async function beginIncident(details?: Record<string, unknown>): Promise<string> {
  const incidentId = createId("inc");
  await auditEvent({
    level: "info",
    category: "incident",
    action: "start",
    correlationId: incidentId,
    details
  });
  return incidentId;
}

/** End an incident by correlation id. */
export async function endIncident(
  incidentId: string,
  details?: Record<string, unknown>
): Promise<void> {
  await auditEvent({
    level: "info",
    category: "incident",
    action: "end",
    correlationId: incidentId,
    details
  });
}
