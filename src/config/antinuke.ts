/**
 * Anti-nuke configuration (defaults)
 * This module defines types + a default config object. It supports an optional
 * `enabled` flag on counters for convenience (no TS error).
 *
 * Other modules can import either named exports or the default config.
 */

export interface CounterConfig {
  /** Sliding window length in milliseconds. */
  windowMs: number;
  /** Score added per matching event. */
  scorePerEvent: number;
  /** Threshold at/over which the action is considered triggered. */
  threshold: number;
  /** Optional feature gate for this counter. */
  enabled?: boolean;
}

export interface AntiNukeConfig {
  /** Per-event counters. Keys are event types like "channelDelete". */
  counters: Record<string, CounterConfig>;
}

/** Sensible defaults aligned with your current behavior (30s, 0.5, 1). */
export const DEFAULT_COUNTERS: Record<string, CounterConfig> = {
  channelDelete: {
    windowMs: 30_000,
    scorePerEvent: 0.5,
    threshold: 1,
    enabled: true,
  },
  roleDelete: {
    windowMs: 30_000,
    scorePerEvent: 0.5,
    threshold: 1,
    enabled: true,
  },
  webhooksUpdate: {
    windowMs: 30_000,
    scorePerEvent: 0.5,
    threshold: 1,
    enabled: true,
  },
};

export const CONFIG: AntiNukeConfig = {
  counters: DEFAULT_COUNTERS,
};

/**
 * Helper to obtain the current anti-nuke config.
 * (If you later want to load from JSON/env, you can extend this function.)
 */
export function getAntiNukeConfig(): AntiNukeConfig {
  return CONFIG;
}

export default CONFIG;
