// src/config/antinuke.ts
import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

import {
  AntiNukeConfigSchema,
  type AntiNukeConfig,
} from "../antinuke/window.js";
import { logger } from "../logger.js";

const DEFAULT_PATH = path.join(process.cwd(), "data", "antinuke-config.json");

export function loadAntinukeConfig(filePath = DEFAULT_PATH): AntiNukeConfig {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);
    const cfg = AntiNukeConfigSchema.parse(json);
    return cfg;
  } catch (err) {
    if (err && typeof err === "object") {
      if ((err as any).code === "ENOENT") {
        throw new Error(`AntiNuke config missing at ${filePath}`);
      }
      if (err instanceof z.ZodError) {
        const details = JSON.stringify(err.issues ?? [], null, 2);
        throw new Error(`AntiNuke config invalid at ${filePath}: ${details}`);
      }
      if ((err as any).name === "SyntaxError") {
        throw new Error(
          `AntiNuke config is not valid JSON at ${filePath}: ${(err as any).message}`,
        );
      }
    }
    throw err;
  }
}

/**
 * Safe variant for dev/bootstrap paths: returns a disabled config on error.
 * Logs a clear warning so issues are visible without crashing the app.
 */
export function safeLoadAntinukeConfig(
  filePath = DEFAULT_PATH,
): AntiNukeConfig {
  try {
    return loadAntinukeConfig(filePath);
  } catch (e) {
    logger.warn(
      { err: e instanceof Error ? e.message : String(e), filePath },
      "Falling back to disabled AntiNuke config",
    );
    return {
      enabled: false,
      windowMs: 60_000,
      thresholds: {},
      actionOnTrip: "log",
      timeoutSeconds: 0,
    };
  }
}
