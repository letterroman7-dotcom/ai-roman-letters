// src/lib/audit.ts
import { randomUUID } from "node:crypto";

import { logger } from "../utils/logger.js"; // fixed path

type AuditDetails = Record<string, unknown>;

export function audit(
  category: string,
  action: string,
  details: AuditDetails,
  correlationId = "",
) {
  const evt = {
    audit: true,
    id: `evt_${randomUUID()}`,
    ts: new Date().toISOString(),
    category,
    action,
    actorId: "",
    targetId: "",
    correlationId,
    details,
  };
  logger.info(evt, "audit");
  return evt;
}
