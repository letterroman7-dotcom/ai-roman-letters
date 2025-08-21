import type { Inventory, InvFile } from "./util.js";

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

/** Detect relative ESM imports missing a .js-like extension. */
export function buildPolicyChecks(inv: Inventory) {
  const duplicatedNames = collectDuplicateNames(inv.files);

  const missingJsExtension: Array<{ file: string; line: number; spec: string }> = [];
  const relImportRegex1 = /import\s+[^'"]*from\s+['"]([^'"]+)['"]/g;  // import x from '...'
  const relImportRegex2 = /import\s+['"]([^'"]+)['"]/g;               // import '...'

  for (const f of inv.files) {
    if (!/\.tsx?$|\.jsx?$/.test(f.ext)) continue;
    if (!f.contentChunks) continue;

    for (const chunk of f.contentChunks) {
      const scan = (re: RegExp) => {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(chunk.text))) {
          const spec = m[1] as string | undefined;
          if (!spec) continue;
          if (!spec.startsWith("./") && !spec.startsWith("../")) continue;
          if (spec.endsWith("/") || /(\.js|\.mjs|\.cjs|\.json|\.node)$/i.test(spec)) continue;
          const line = chunk.startLine + (chunk.text.slice(0, m.index).match(/\n/g)?.length ?? 0);
          missingJsExtension.push({ file: f.pathRel, line, spec });
        }
      };
      scan(relImportRegex1);
      scan(relImportRegex2);
    }
  }

  return {
    duplicates: { sameName: duplicatedNames },
    imports: { missingJsExtension }
  };
}

function collectDuplicateNames(files: InvFile[]) {
  const sameName: Record<string, string[]> = {};
  for (const f of files) {
    const name = f.pathRel.split("/").pop()!;
    (sameName[name] ||= []).push(f.pathRel);
  }
  return Object.entries(sameName)
    .filter(([, paths]) => paths.length > 1)
    .map(([name, paths]) => ({ name, paths }));
}
