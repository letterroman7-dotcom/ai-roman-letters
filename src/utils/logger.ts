import pino from "pino";

import type { Guild } from "discord.js";

/**
 * Minimal shape we care about from a Guild.
 * We keep this narrow to avoid runtime Discord client dependencies.
 */
export type GuildLike =
  | Pick<Guild, "id" | "name">
  | { id: string; name?: string }
  | undefined;

function isGuildLike(obj: unknown): obj is { id: string; name?: string } {
  if (!obj || typeof obj !== "object") return false;
  const rec = obj as Record<string, unknown>;
  return typeof rec.id === "string";
}

/** Extracts safe guild fields for logging. */
export function guildFields(guild?: GuildLike) {
  if (!isGuildLike(guild)) return {};
  const { id, name } = guild;
  return name ? { guildId: id, guildName: name } : { guildId: id };
}

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export { logger };
export default logger;
