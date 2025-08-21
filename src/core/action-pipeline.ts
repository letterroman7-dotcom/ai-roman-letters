type AuditFn = (rec: { category: string; action: string; details?: Record<string, unknown> }) => Promise<void>;

type HandlerCtx = { audit: AuditFn };
type Action = { type: string; payload?: unknown };

let initialized = false;

export function initActionPipeline(): void {
  initialized = true;
}

export async function enqueueAction(
  action: Action,
  handler: (ctx: HandlerCtx) => Promise<boolean>
): Promise<boolean> {
  if (!initialized) throw new Error("Action pipeline not initialized");
  const audit: AuditFn = async () => { /* no-op hook for now; wired later */ };
  return handler({ audit });
}
