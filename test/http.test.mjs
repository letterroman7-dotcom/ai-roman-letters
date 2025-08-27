// test/http.test.mjs
// Boots the compiled server and exercises /health and /panic/* endpoints.
import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const NODE = process.execPath;
const BOOT = "dist/bootstrap.js";
const BASE = "http://127.0.0.1:4000";

function terminate(proc) {
  if (proc.killed) return;
  if (process.platform === "win32") {
    execFile("taskkill", ["/PID", String(proc.pid), "/T", "/F"], () => void 0);
  } else {
    proc.kill("SIGTERM");
  }
}

async function waitForHealthy(timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch {
      // server not ready yet
    }
    await delay(150);
  }
  throw new Error("server did not become healthy in time");
}

test("HTTP /health and /panic/* respond", { concurrency: false }, async (t) => {
  const child = spawn(NODE, [BOOT], {
    env: { ...process.env, LOG_LEVEL: "fatal" }, // quiet logs
    stdio: "ignore",
    windowsHide: true,
  });
  t.after(() => terminate(child));

  await waitForHealthy();

  // /health
  {
    const r = await fetch(`${BASE}/health`);
    assert.equal(r.status, 200);
    await r.json().catch(() => ({}));
  }

  // /panic/on
  {
    const r = await fetch(`${BASE}/panic/on`, { method: "POST" });
    assert.equal(r.status, 200);
    await r.json().catch(() => ({}));
  }

  // /panic/status
  {
    const r = await fetch(`${BASE}/panic/status`);
    assert.equal(r.status, 200);
    await r.json().catch(() => ({}));
  }

  // /panic/off
  {
    const r = await fetch(`${BASE}/panic/off`, { method: "POST" });
    assert.equal(r.status, 200);
    await r.json().catch(() => ({}));
  }
});
