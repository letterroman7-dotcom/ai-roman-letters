// src/utils/text/similarity.ts
import { tokens, shingles } from "./tokenize.js";

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter((x) => b.has(x)));
  const uni = new Set([...a, ...b]);
  if (uni.size === 0) return 0;
  return inter.size / uni.size;
}

export function jaccardTokens(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  return jaccard(A, B);
}

export function jaccardShingles(a: string, b: string, k = 3): number {
  const A = new Set(shingles(tokens(a), k));
  const B = new Set(shingles(tokens(b), k));
  return jaccard(A, B);
}
