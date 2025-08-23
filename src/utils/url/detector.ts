// src/utils/url/detector.ts
export interface DetectedUrl {
  raw: string;
  href: string;
  host: string;
}

const URL_LIKE = /\b((https?:\/\/|www\.)[^\s<>"')]{1,})/gi;

function hasDotHost(u: URL): boolean {
  return (u.hostname || "").includes(".");
}

export function extractUrls(text: string): DetectedUrl[] {
  const found = new Set<string>();
  const out: DetectedUrl[] = [];

  let m: RegExpExecArray | null;
  while ((m = URL_LIKE.exec(text)) !== null) {
    const raw = (m[1] ?? "").trim();
    if (!raw) continue;

    const normalized: string = /^https?:\/\//i.test(raw)
      ? raw
      : `http://${raw}`;
    try {
      const u = new URL(normalized);
      if (!hasDotHost(u)) continue;
      const href = `${u.protocol}//${u.host}${u.pathname}${u.search}${u.hash}`;
      if (found.has(href)) continue;
      found.add(href);
      out.push({ raw, href, host: u.host });
    } catch {
      // ignore invalid URLs
    }
  }
  return out;
}

export function countUrls(text: string): number {
  return extractUrls(text).length;
}

export function hosts(text: string): string[] {
  return extractUrls(text).map((u) => u.host);
}
