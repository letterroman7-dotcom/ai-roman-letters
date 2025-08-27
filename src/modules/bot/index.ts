import { registerSkills } from "../../bot/skills/index.js";

import type { BotLike } from "../../bot/skills/ask.js";

/**
 * Called from src/core/wire-modules.ts as: await registerBot(app)
 * Accept the App, locate a Bot-like object on it, then attach skills.
 */
export default async function registerBot(app: unknown): Promise<void> {
  const a = app as Record<string, unknown> | undefined;

  // Adjust these lookups to match where your bot instance actually lives:
  const candidate: BotLike | undefined =
    (a?.bot as BotLike) ??
    (a?.services as any)?.bot ??
    (a?.modules as any)?.bot ??
    (a as any)?.discord?.bot;

  if (candidate && typeof candidate.use === "function") {
    registerSkills(candidate);
  } else {
    console.warn(
      "[modules/bot] No Bot-like object found on app; skills not registered."
    );
  }
}
