// src/core/action-pipeline.ts
import {
  enforceBan,
  enforceDelete,
  enforceLog,
  enforceMute,
  enforceQuarantine,
  enforceTimeout,
  enforceWarn,
  type EnforcementAction,
} from "../utils/enforce-safely.js";

import type { EnforcementContext } from "../utils/enforce-safely.js";
import type { Logger } from "pino";

export type ActionRequest =
  | { kind: "delete"; ctx: EnforcementContext }
  | { kind: "warn"; ctx: EnforcementContext }
  | { kind: "timeout"; seconds: number; ctx: EnforcementContext }
  | { kind: "mute"; ctx: EnforcementContext }
  | { kind: "quarantine"; ctx: EnforcementContext }
  | { kind: "ban"; ctx: EnforcementContext }
  | { kind: "log"; ctx: EnforcementContext };

export class ActionPipeline {
  constructor(private log: Logger) {}

  async dispatch(req: ActionRequest): Promise<void> {
    switch (req.kind) {
      case "delete":
        enforceDelete(req.ctx, this.log);
        break;
      case "warn":
        enforceWarn(req.ctx, this.log);
        break;
      case "timeout":
        enforceTimeout(req.ctx, req.seconds, this.log);
        break;
      case "mute":
        enforceMute(req.ctx, this.log);
        break;
      case "quarantine":
        enforceQuarantine(req.ctx, this.log);
        break;
      case "ban":
        enforceBan(req.ctx, this.log);
        break;
      case "log":
      default:
        enforceLog(req.ctx, this.log);
        break;
    }
  }
}

export function toActionRequest(
  action: EnforcementAction,
  ctx: EnforcementContext,
  extras?: { seconds?: number },
): ActionRequest {
  switch (action) {
    case "delete":
      return { kind: "delete", ctx };
    case "warn":
      return { kind: "warn", ctx };
    case "timeout":
      return { kind: "timeout", ctx, seconds: extras?.seconds ?? 60 };
    case "mute":
      return { kind: "mute", ctx };
    case "quarantine":
      return { kind: "quarantine", ctx };
    case "ban":
      return { kind: "ban", ctx };
    case "log":
    default:
      return { kind: "log", ctx };
  }
}
