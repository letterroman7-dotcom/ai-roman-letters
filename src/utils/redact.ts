// src/utils/redact.ts
export function redact(input: string): string {
  if (!input) return input;
  let out = input;
  // discord-like tokens / long alphanum
  out = out.replace(
    /[A-Za-z0-9_\-]{24,}\.[A-Za-z0-9_\-]{6,}\.[A-Za-z0-9_\-]{27,}/g,
    "[redacted:token]",
  );
  // IDs (snowflakes)
  out = out.replace(/\b\d{16,20}\b/g, "[redacted:id]");
  // URLs
  out = out.replace(/\bhttps?:\/\/[^\s<>'")]+/gi, "[redacted:url]");
  return out;
}
