// scripts/lint-src.cjs

const { spawnSync } = require("node:child_process");

function hasEslint() {
  try {
    require.resolve("eslint");
    return true;
  } catch {
    return false;
  }
}

if (!hasEslint()) {
  console.log("[lint] ESLint not found — skipping (this is OK).");
  process.exit(0);
}

const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const res = spawnSync(
  cmd,
  ["eslint", "src", "--ext", ".ts,.tsx,.js,.cjs,.mjs"],
  {
    stdio: "inherit",
  }
);
process.exit(res.status ?? 0);
