// src/antinuke/service.ts
// Thin facade over window counters (keeps older imports working).

import {
  currentAntiNukeTuning,
  recordAdminAction,
  statusByCategory,
  getActorScore,
  isActorTriggered,
  resetWindow,
  type ActionKind,
  type AntiNukeTuning,
} from "./window.js";

export { type ActionKind, type AntiNukeTuning, currentAntiNukeTuning };

// Back-compat aliases (existing code imports these names)
export { statusByCategory, getActorScore, isActorTriggered, recordAdminAction };

/** Back-compat: older code imported this. It's a no-op now. */
export async function reloadAntiNuke(): Promise<void> {
  // Intentionally empty – config/state is dynamic in KV.
}

/** Exposed for CLI/demo: wipes all AntiNuke counters & dedupe markers. */
export async function resetAntiNukeState(): Promise<void> {
  await resetWindow();
}

// Convenience facades (optional)
export async function statusByCategoryFacade(): Promise<Record<string, number>> {
  return statusByCategory();
}
export async function getActorScoreFacade(): Promise<number> {
  return getActorScore();
}
export async function isActorTriggeredFacade(): Promise<boolean> {
  return isActorTriggered();
}
export async function recordAdminActionFacade(kind: ActionKind, count = 1): Promise<number> {
  return recordAdminAction(kind, count);
}
