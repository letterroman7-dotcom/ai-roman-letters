import crypto from "node:crypto";

/** Create a fast unique id; optional prefix for readability. */
export function createId(prefix?: string): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}
