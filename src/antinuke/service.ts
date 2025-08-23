import path from "node:path";

import {
  loadAntinukeConfig,
  safeLoadAntinukeConfig,
} from "../config/antinuke.js";
import { logger } from "../logger.js";

import {
  type AntiNukeConfig,
  SlidingWindowCounter,
  makeCounterFromConfig,
} from "./window.js";

type State = {
  filePath: string;
  loadedAt: string; // ISO timestamp
  config: AntiNukeConfig;
  counter: SlidingWindowCounter | null;
};

const DEFAULT_FILE = path.join(process.cwd(), "data", "antinuke-config.json");

let state: State = init();

/** Safe boot: if config is invalid, fall back to disabled counter so the app still runs. */
function init(): State {
  const cfg = safeLoadAntinukeConfig(DEFAULT_FILE);
  return {
    filePath: DEFAULT_FILE,
    loadedAt: new Date().toISOString(),
    config: cfg,
    counter: cfg.enabled ? makeCounterFromConfig(cfg) : null,
  };
}

/** Public status used by /antinuke/status */
export function getAntiNukeStatus() {
  const { filePath, loadedAt, config, counter } = state;
  return {
    filePath,
    loadedAt,
    enabled: config.enabled,
    windowMs: config.windowMs,
    thresholds: config.thresholds,
    actionOnTrip: config.actionOnTrip,
    timeoutSeconds: config.timeoutSeconds,
    counterReady: Boolean(counter),
  };
}

/** Reload from disk (optionally a different path), rebuild counter, return new status. */
export function reloadAntiNuke(filePath?: string) {
  const resolved = filePath ?? state.filePath ?? DEFAULT_FILE;
  const cfg = loadAntinukeConfig(resolved);

  state = {
    filePath: resolved,
    loadedAt: new Date().toISOString(),
    config: cfg,
    counter: cfg.enabled ? makeCounterFromConfig(cfg) : null,
  };

  logger.info(
    { filePath: resolved, enabled: cfg.enabled },
    "AntiNuke config reloaded",
  );
  return getAntiNukeStatus();
}

/** Obtain the live counter instance (null if disabled). */
export function getCounter(): SlidingWindowCounter | null {
  return state.counter;
}
