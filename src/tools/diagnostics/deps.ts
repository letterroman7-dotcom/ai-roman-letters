import path from "node:path";
import type { Inventory } from "./util.js";

// We dynamically import TypeScript at runtime to avoid ESM/loader quirks
let ts: typeof import("typescript");

/** Safe dynamic import for the 'typescript' module. */
async function getTS() {
  if (!ts) {
    ts = await import("typescript");
  }
  return ts;
}

/** Build an import dependency graph using TypeScript's stable resolver. */
export async function buildDepsGraph(root: string, inv: Inventory) {
  const TS = await getTS();

  // Locate and parse tsconfig; if missing, return empty graph
  const tsconfigPath = TS.findConfigFile(root, TS.sys.fileExists, "tsconfig.json");
  if (!tsconfigPath) {
    return { nodes: [], edges: [] };
  }
  const configFile = TS.readConfigFile(tsconfigPath, TS.sys.readFile);
  const configParse = TS.parseJsonConfigFileContent(
    configFile.config,
    TS.sys,
    path.dirname(tsconfigPath)
  );

  // Create a program over all TS/TSX files from our inventory
  const rootNames = inv.files
    .filter((f) => f.pathRel.endsWith(".ts") || f.pathRel.endsWith(".tsx"))
    .map((f) => f.pathAbs);

  const program = TS.createProgram({
    rootNames,
    options: configParse.options,
  });

  const nodes: string[] = [];
  const edgePairs: Array<{ from: string; to: string }> = [];

  // Use TypeScript's module resolver (stable API)
  const host: TS.ModuleResolutionHost = TS.sys;
  const compilerOptions = configParse.options;

  for (const sf of program.getSourceFiles()) {
    const file = sf.fileName;
    // Only consider files inside our root and not inside node_modules
    if (!file.startsWith(root) || file.includes("node_modules")) continue;

    nodes.push(file);

    sf.forEachChild((node) => {
      if (
        TS.isImportDeclaration(node) &&
        node.moduleSpecifier &&
        TS.isStringLiteral(node.moduleSpecifier)
      ) {
        const spec = node.moduleSpecifier.text;

        // Resolve import using TS resolver (handles NodeNext, paths, etc.)
        const resolved = TS.resolveModuleName(spec, file, compilerOptions, host).resolvedModule;

        if (resolved?.resolvedFileName && resolved.resolvedFileName.startsWith(root)) {
          // Only track edges to files within our repo
          edgePairs.push({ from: file, to: resolved.resolvedFileName });
        }
      }
    });
  }

  // De-duplicate nodes/edges
  const uniqueNodes = Array.from(new Set(nodes));
  const uniqueEdges = Array.from(
    new Set(edgePairs.map((e) => `${e.from}=>${e.to}`))
  ).map((k) => {
    const [from, to] = k.split("=>");
    return { from, to };
  });

  return { nodes: uniqueNodes, edges: uniqueEdges };
}
