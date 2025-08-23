// src/utils/enforce-safely.ts
import type { Logger } from "pino";

export type EnforcementAction =
  | "delete"
  | "warn"
  | "timeout"
  | "mute"
  | "quarantine"
  | "ban"
  | "log";

export interface EnforcementContext {
  guildId?: string;
  channelId?: string;
  messageId?: string;
  userId?: string;
  reason?: string;
}

function logOnly(
  action: EnforcementAction,
  ctx: EnforcementContext,
  log: Logger,
) {
  log.info({ action, ctx }, "enforce (noop)");
}

export function enforceDelete(ctx: EnforcementContext, log: Logger) {
  logOnly("delete", ctx, log);
}

export function enforceWarn(ctx: EnforcementContext, log: Logger) {
  logOnly("warn", ctx, log);
}

export function enforceTimeout(
  ctx: EnforcementContext,
  seconds: number,
  log: Logger,
) {
  log.info({ action: "timeout", seconds, ctx }, "enforce (noop)");
}

export function enforceMute(ctx: EnforcementContext, log: Logger) {
  logOnly("mute", ctx, log);
}

export function enforceQuarantine(ctx: EnforcementContext, log: Logger) {
  logOnly("quarantine", ctx, log);
}

export function enforceBan(ctx: EnforcementContext, log: Logger) {
  logOnly("ban", ctx, log);
}

export function enforceLog(ctx: EnforcementContext, log: Logger) {
  logOnly("log", ctx, log);
}
