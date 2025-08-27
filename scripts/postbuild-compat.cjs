// scripts/postbuild-compat.cjs
// Make a couple of convenience copies so old entrypoints still work.

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[postbuild-compat] copied -> ${dest}`);
}

// mirror old locations if present in build output
copyIfExists(
  path.join(root, "dist", "src", "cli.js"),
  path.join(root, "dist", "cli.js")
);

copyIfExists(
  path.join(root, "dist", "src", "antinuke", "window.js"),
  path.join(root, "dist", "antinuke", "window.js")
);
