// src/utils/reputation/domain.ts
import { readFileSync } from "node:fs";
import path from "node:path";

type Lists = {
  allow: string[];
  block: string[];
  nsfw: string[];
  malicious: string[];
};

let cache: { ts: number; data: Lists } | null = null;

function loadLists(): Lists {
  if (cache && Date.now() - cache.ts < 5000) return cache.data;
  const file = path.join(
    process.cwd(),
    "src",
    "data",
    "reputation",
    "domain-lists.json",
  );
  const raw = readFileSync(file, "utf8");
  const data = JSON.parse(raw) as Lists;
  cache = { ts: Date.now(), data };
  return data;
}

export type DomainCategory =
  | "allow"
  | "block"
  | "nsfw"
  | "malicious"
  | "unknown";

export function categorize(host: string): DomainCategory {
  const h = (host || "").toLowerCase();
  if (!h) return "unknown";
  const lists = loadLists();
  if (lists.allow.includes(h)) return "allow";
  if (lists.block.includes(h)) return "block";
  if (lists.nsfw.includes(h)) return "nsfw";
  if (lists.malicious.includes(h)) return "malicious";
  return "unknown";
}
