// src/antinuke/window.ts
import { z } from "zod";

export const ThresholdsSchema = z.record(
  z.string(),
  z.number().int().nonnegative({ message: "must be nonnegative" }),
);

export const AntiNukeConfigSchema = z.object({
  enabled: z.boolean(),
  windowMs: z.number().int().positive({ message: "must be greater than 0" }),
  thresholds: ThresholdsSchema,
  actionOnTrip: z.enum([
    "quarantine",
    "ban",
    "timeout",
    "mute",
    "warn",
    "delete",
    "log",
  ]),
  timeoutSeconds: z.number().int().nonnegative(),
});

export type Thresholds = z.infer<typeof ThresholdsSchema>;
export type AntiNukeConfig = z.infer<typeof AntiNukeConfigSchema>;

export type Trip = {
  actorId: string;
  eventType: string;
  count: number;
  threshold: number;
};

type Bucket = number[];

export class SlidingWindowCounter {
  private readonly windowMs: number;
  private readonly thresholds: Thresholds;
  private readonly buckets: Map<string, Map<string, Bucket>> = new Map();

  constructor(opts: { windowMs: number; thresholds: Thresholds }) {
    this.windowMs = opts.windowMs;
    this.thresholds = { ...opts.thresholds };
  }

  record(eventType: string, actorId: string, now: number): void {
    let byEvent = this.buckets.get(actorId);
    if (!byEvent) {
      byEvent = new Map();
      this.buckets.set(actorId, byEvent);
    }

    const bucket = byEvent.get(eventType) ?? [];
    const since = now - this.windowMs;

    let start = 0;
    while (start < bucket.length) {
      const v = bucket[start];
      if (v !== undefined && v < since) {
        start++;
        continue;
      }
      break;
    }
    if (start > 0) bucket.splice(0, start);

    bucket.push(now);
    byEvent.set(eventType, bucket);
  }

  counts(actorId: string, now: number): Record<string, number> {
    const byEvent = this.buckets.get(actorId);
    if (!byEvent) return {};
    const out: Record<string, number> = {};
    const since = now - this.windowMs;

    for (const [eventType, bucket] of byEvent) {
      let start = 0;
      while (start < bucket.length) {
        const v = bucket[start];
        if (v !== undefined && v < since) {
          start++;
          continue;
        }
        break;
      }
      if (start > 0) bucket.splice(0, start);
      out[eventType] = bucket.length;
    }
    return out;
  }

  evaluate(actorId: string, now: number): Trip[] {
    const counts = this.counts(actorId, now);
    const trips: Trip[] = [];
    for (const [eventType, threshold] of Object.entries(this.thresholds)) {
      const count = counts[eventType] ?? 0;
      if (threshold > 0 && count >= threshold)
        trips.push({ actorId, eventType, count, threshold });
    }
    return trips;
  }

  recordAndEvaluate(eventType: string, actorId: string, now: number): Trip[] {
    this.record(eventType, actorId, now);
    return this.evaluate(actorId, now);
  }
}

export function makeCounterFromConfig(
  cfg: AntiNukeConfig,
): SlidingWindowCounter {
  AntiNukeConfigSchema.parse(cfg);
  return new SlidingWindowCounter({
    windowMs: cfg.windowMs,
    thresholds: cfg.thresholds,
  });
}

export function validateConfig(cfg: unknown): AntiNukeConfig {
  try {
    return AntiNukeConfigSchema.parse(cfg);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const details = JSON.stringify(e.issues ?? [], null, 2);
      // Keep tests stable: include "Required" hint + Zod details
      throw new Error(`Required: ${details}`);
    }
    throw e;
  }
}
