/**
 * Lightweight log redaction helpers.
 *
 * Removes secret-ish values next to common keys and long opaque tokens.
 * Hyphens are not escaped in regex where unnecessary to satisfy ESLint.
 */

const SECRET_KEYS = [
  "api-key",
  "x-api-token",
  "client-secret",
  "authorization",
  "auth-token",
  "access-token",
  "refresh-token",
];

/**
 * Key/value secrets like:
 *   api-key=abcd123
 *   x-api-token: foo
 *   Authorization Bearer eyJhbGciOi...
 *
 * Captures the key (group 1) and replaces the value with ***REDACTED***.
 */
const KEY_VALUE_RE = new RegExp(
  // word boundary + (key) + optional separators + (value)
  `\\b(?:${SECRET_KEYS.join("|")})\\b\\s*(?:[:=]|\\bBearer\\b)?\\s*([^\\s,;]+)`,
  "gi",
);

/**
 * Bare long tokens (32+ of URL-safe/word chars).
 * Hyphen is placed at the end of the character class, so no escaping needed.
 */
const BARE_TOKEN_RE = /\b[A-Za-z0-9_~-]{32,}\b/g;

/** Redact a single string. */
export function redact(input: string): string {
  if (!input) return input;

  // Replace values next to known secret keys
  let out = input.replace(KEY_VALUE_RE, (m, _value) => {
    // Replace just the captured value; keep the prefix if present.
    return m.replace(_value, "***REDACTED***");
  });

  // Replace any long bare token substrings
  out = out.replace(BARE_TOKEN_RE, "***REDACTED***");

  return out;
}

export default redact;
