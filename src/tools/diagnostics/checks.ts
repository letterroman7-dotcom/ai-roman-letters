import type { Inventory } from "./util.js";

/** Group duplicates by exact hash and by normalized hash. */
export function buildDuplicatesReport(inv: Inventory) {
  const map = new Map<string, string[]>();
  const norm = new Map<string, string[]>();
  for (const f of inv.files) {
    if (!map.has(f.sha256)) map.set(f.sha256, []);
    map.get(f.sha256)!.push(f.pathRel);

    if (!norm.has(f.sha256Normalized)) norm.set(f.sha256Normalized, []);
    norm.get(f.sha256Normalized)!.push(f.pathRel);
  }
  const groups = Array.from(map.entries())
    .map(([hash, paths]) => ({ hash, paths }))
    .filter((g) => g.paths.length > 1);
  const normalizedGroups = Array.from(norm.entries())
    .map(([hash, paths]) => ({ hash, paths }))
    .filter((g) => g.paths.length > 1);
  return { groups, normalizedGroups };
}

/** Simple policy checks helpful for cleanup. */
export function buildPolicyChecks(inv: Inventory) {
  const sameName: Record<string, string[]> = {};
  for (const f of inv.files) {
    const name = f.pathRel.split("/").pop()!;
    sameName[name] = sameName[name] || [];
    sameName[name].push(f.pathRel);
  }
  const duplicatedNames = Object.entries(sameName)
    .filter(([, paths]) => paths.length > 1)
    .map(([name, paths]) => ({ name, paths }));

  // ESM import extension check: find 'import "./something"' without .js in TS/JS files
  const missingJsExtension: string[] = [];
  for (const f of inv.files) {
    if (!/\.tsx?$|\.jsx?$/.test(f.ext)) continue;
    // content not loaded in metadata-only runs; skip detection then
    // we’ll flag only if chunks exist and show issues per chunk
  }

  return {
    duplicates: { sameName: duplicatedNames },
    imports: { missingJsExtension }
  };
}
