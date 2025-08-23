// src/bootstrap.ts
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";

import { getAntiNukeStatus, reloadAntiNuke } from "./antinuke/service.js";
import { logger } from "./logger.js";

const PORT = Number(process.env.PORT ?? 3000);
const panicLock = path.join(process.cwd(), ".panic.lock");

function panicStatus(): "on" | "off" {
  try {
    return fs.existsSync(panicLock) ? "on" : "off";
  } catch {
    return "off";
  }
}

function setPanic(on: boolean) {
  try {
    if (on) fs.writeFileSync(panicLock, "panic", "utf8");
    else if (fs.existsSync(panicLock)) fs.unlinkSync(panicLock);
  } catch (e) {
    logger.warn(
      { err: e instanceof Error ? e.message : String(e) },
      "panic toggle failed",
    );
  }
}

function sendJson(res: http.ServerResponse, code: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(json),
    "cache-control": "no-store",
  });
  res.end(json);
}

function sendText(res: http.ServerResponse, code: number, text = "") {
  res.writeHead(code, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) return sendText(res, 400, "Bad Request");
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type");
    if (req.method === "OPTIONS") return sendText(res, 204);

    if (req.method === "GET" && pathname === "/health") {
      return sendJson(res, 200, { ok: true, panic: panicStatus() });
    }

    if (
      (req.method === "GET" || req.method === "POST") &&
      pathname === "/panic/status"
    ) {
      return sendJson(res, 200, { panic: panicStatus() });
    }
    if (
      (req.method === "GET" || req.method === "POST") &&
      pathname === "/panic/on"
    ) {
      setPanic(true);
      return sendJson(res, 200, { panic: panicStatus() });
    }
    if (
      (req.method === "GET" || req.method === "POST") &&
      pathname === "/panic/off"
    ) {
      setPanic(false);
      return sendJson(res, 200, { panic: panicStatus() });
    }

    if (req.method === "GET" && pathname === "/antinuke/status") {
      return sendJson(res, 200, getAntiNukeStatus());
    }
    if (req.method === "POST" && pathname === "/antinuke/reload") {
      const file = url.searchParams.get("file") ?? undefined;
      const status = reloadAntiNuke(file);
      return sendJson(res, 200, status);
    }

    if (req.method === "GET" && pathname === "/favicon.ico") {
      return sendText(res, 204);
    }

    return sendText(res, 404, "Not Found");
  } catch (e) {
    logger.error(
      { err: e instanceof Error ? (e.stack ?? e.message) : String(e) },
      "uncaught error",
    );
    return sendJson(res, 500, { ok: false, error: "internal_error" });
  }
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, "HTTP server listening");
});
