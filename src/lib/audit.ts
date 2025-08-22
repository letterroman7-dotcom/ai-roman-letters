import { randomUUID } from "node:crypto";
import { logger } from "./logger.js";

type AuditDetails = Record<string, unknown>;

export function audit(category: string, action: string, details: AuditDetails, correlationId = "") {
  const evt = {
    audit: true,
    id: `evt_${randomUUID()}`,
    ts: new Date().toISOString(),
    category,
    action,
    actorId: "",
    targetId: "",
    guildId: "",
    correlationId,
    details,
  };
  logger.info(evt, `[audit] ${category}.${action}`);
}
