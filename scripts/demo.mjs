// scripts/demo.mjs
import { execFileSync } from "node:child_process";

function extractLastJSONArray(text) {
  const start = text.lastIndexOf("[");
  if (start === -1) return "[]";
  const end = text.indexOf("]", start);
  if (end === -1) return "[]";
  return text.slice(start, end + 1); // full multi-line JSON array
}

function send(cmd) {
  const out = execFileSync("node", ["./dist/cli.js", "bot:send", cmd], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  console.log(extractLastJSONArray(out));
}

send("echo hello world");
send("reverse tacos");
send("ask Why Is The Sky Blue?");
send("sum 1, 2, 3"); // include sum in the demo
