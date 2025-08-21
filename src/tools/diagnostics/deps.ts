import path from "node:path";

import type { Inventory } from "./util.js";

// dynamic import of TS to avoid loader quirks
let ts: typeof import("typescript");
async function getTS() {
  ts = ts ?? (await import("typescript"));
  return ts;
}

/** Build an import dependency graph using TypeScript's stable resolver. */
export async function buildDepsGraph(root: string, inv: Inventory) {
  const TS = await getTS();

  // wrap unbound methods to satisfy lint rule
  const fileExists = (p: string) => TS.sys.fileExists(p);
  const readFile = (p: string) => TS.sys.readFile(p);

  const tsconfigPath = TS.findConfigFile(root, fileExists, "tsconfig.json");
  if (!tsconfigPath) return { nodes: [], edges: [] };

  const configFile = TS.readConfigFile(tsconfigPath, readFile);
  const configParse = TS.parseJsonConfigFileContent(
    configFile.config,
    TS.sys,
    path.dirname(tsconfigPath)
  );

  const rootNames = inv.files
    .filter((f) => f.pathRel.endsWith(".ts") || f.pathRel.endsWith(".tsx"))
    .map((f) => f.pathAbs);

  const program = TS.createProgram({ rootNames, options: configParse.options });

  const nodes: string[] = [];
  const edges: Array<{ from: string; to: string }> = [];

  const host: import("typescript").ModuleResolutionHost = TS.sys;
  const compilerOptions = configParse.options;

  for (const sf of program.getSourceFiles()) {
    const file = sf.fileName;
    if (!file.startsWith(root) || file.includes("node_modules")) continue;

    nodes.push(file);

    sf.forEachChild((node) => {
      if (
        TS.isImportDeclaration(node) &&
        node.moduleSpecifier &&
        TS.isStringLiteral(node.moduleSpecifier)
      ) {
        const spec = node.moduleSpecifier.text;
        const resolved = TS.resolveModuleName(spec, file, compilerOptions, host).resolvedModule;
        if (resolved?.resolvedFileName && resolved.resolvedFileName.startsWith(root)) {
          edges.push({ from: file, to: resolved.resolvedFileName });
        }
      }
    });
  }

  // de-dupe
  const nodeSet = Array.from(new Set(nodes));
  const edgeSet = Array.from(new Set(edges.map((e) => `${e.from}=>${e.to}`))).map((k) => {
    const [from, to] = k.split("=>");
    return { from, to };
  });

  return { nodes: nodeSet, edges: edgeSet };
}

/** Find "dead" TS/TSX files: zero inbound edges and not in roots/ignored. */
export function findDeadFiles(
  deps: { nodes: string[]; edges: Array<{ from: string; to: string }> },
  roots: string[],
  ignore: RegExp[] = [/\.test\.tsx?$/i, /\.spec\.tsx?$/i]
) {
  const inbound = new Map<string, number>();
  for (const n of deps.nodes) inbound.set(n, 0);
  for (const e of deps.edges) inbound.set(e.to, (inbound.get(e.to) ?? 0) + 1);

  const rootSet = new Set(roots.map((r) => path.resolve(r)));

  const dead: string[] = [];
  for (const n of deps.nodes) {
    const ext = path.extname(n);
    if (!/\.tsx?$/i.test(ext)) continue;
    if (rootSet.has(path.resolve(n))) continue;
    if (ignore.some((re) => re.test(n))) continue;
    if ((inbound.get(n) ?? 0) === 0) dead.push(n);
  }
  return dead;
}
