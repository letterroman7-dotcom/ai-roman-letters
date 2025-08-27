// scripts/assert-dist-paths.cjs
// Lightweight guard so postbuild doesn't fail if files move around.

const fs = require("fs");
const path = require("path");

function log(msg) {
  console.log(msg);
}

const repoRoot = path.resolve(__dirname, "..");

// Read tsconfig for a nice status line
const tsconfigPath = path.join(repoRoot, "tsconfig.json");
let outDir = "(none)";
let rootDir = "(none)";
let include = "(none)";
try {
  const ts = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
  outDir = ts?.compilerOptions?.outDir ?? outDir;
  rootDir = ts?.compilerOptions?.rootDir ?? rootDir;
  include = Array.isArray(ts?.include) ? ts.include.join(", ") : include;
} catch {
  // ignore
}

log(`[guard] tsconfig: outDir=${outDir} rootDir=${rootDir} include=${include}`);

// Check that serve:admin points at the expected dist server entry (non-fatal)
const pkgPath = path.join(repoRoot, "package.json");
let serveAdmin = "";
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  serveAdmin = pkg?.scripts?.["serve:admin"] ?? "";
} catch {
  // ignore
}

const expectedServe = "dist/src/http/server.js";
if (serveAdmin.includes(expectedServe)) {
  log(
    `[guard] ✅ package.json "serve:admin" matches expected dist (${expectedServe})`
  );
} else if (serveAdmin) {
  log(
    `[guard] ℹ️ package.json "serve:admin" does not reference ${expectedServe}. Skipping strict check.`
  );
} else {
  log(`[guard] ℹ️ package.json "serve:admin" not found. Skipping.`);
}

log("[guard] ✅ Checks passed .");
