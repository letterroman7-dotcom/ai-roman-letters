// Central registry for bot skills
// Keeps all skill wiring in one place so modules/bot can import a single entrypoint.
import { registerAsk } from "./ask.js";

import type { BotLike } from "./ask.js";

export function registerSkills(bot: BotLike): void {
  registerAsk(bot);
}
