// scripts/validate-ai-lock.cjs
const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

function mustExist(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.error(`[A\`I lock] missing required path: ${rel}`);
    process.exit(1);
  }
}
function mustNotExist(rel) {
  const p = path.join(ROOT, rel);
  if (fs.existsSync(p)) {
    console.error(`[A\`I lock] forbidden path present: ${rel}`);
    process.exit(1);
  }
}

// Required structure
mustExist("src/utils/logger.ts");
mustExist("src/utils/json-store.ts");
mustExist("src/utils/rate-limit.ts");
mustExist("src/utils/enforce-safely.ts");
mustExist("src/utils/url/detector.ts");
mustExist("src/utils/reputation/domain.ts");
mustExist("src/utils/text/tokenize.ts");
mustExist("src/utils/text/similarity.ts");
mustExist("src/data/feature-flags.json");
mustExist("src/data/reputation/domain-lists.json");

// Forbid legacy duplicates
mustNotExist("src/lib/logger.ts");

console.log("[A`I lock] structure OK");
