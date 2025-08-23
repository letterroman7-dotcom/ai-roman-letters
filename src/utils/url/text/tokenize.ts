// src/utils/text/tokenize.ts
export function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function tokens(s: string): string[] {
  const n = normalize(s);
  return n.length ? n.split(/\W+/).filter(Boolean) : [];
}

export function shingles(arr: string[], k = 3): string[] {
  if (k <= 1) return arr;
  const out: string[] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    out.push(arr.slice(i, i + k).join(" "));
  }
  return out;
}
