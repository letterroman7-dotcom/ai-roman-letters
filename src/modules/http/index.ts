// src/modules/http/index.ts  (existing file â€” replace entirely)
import http from "node:http";

import type { App } from "../../types/app.js";

type Json = Record<string, unknown>;

function sendJson(res: http.ServerResponse, status: number, data: Json) {
  const body = Buffer.from(JSON.stringify(data));
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

function notFound(res: http.ServerResponse) {
  sendJson(res, 404, { ok: false, error: "not_found" });
}

async function readJsonBody(
  req: http.IncomingMessage,
  limitBytes = 8 * 1024
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (c: Buffer) => {
      total += c.length;
      if (total > limitBytes) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", reject);
  });
}

export default async function registerHttp(app: App) {
  const server = http.createServer(async (req, res) => {
    try {
      // CORS preflight
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        });
        res.end();
        return;
      }

      const url = req.url || "/";
      const method = (req.method || "GET").toUpperCase();

      // GET /
      if (method === "GET" && url === "/") {
        sendJson(res, 200, {
          ok: true,
          name: app.name,
          env: app.env,
          cmds: app.listCommands(),
        });
        return;
      }

      // GET /health
      if (method === "GET" && url === "/health") {
        const health = (await app.runCommand("health", [])) as Json;
        sendJson(res, 200, health);
        return;
      }

      // ---- Panic endpoints ----
      // GET /panic/status
      if (method === "GET" && url === "/panic/status") {
        const s = (await app.runCommand("panic:status", [])) as Json;
        sendJson(res, 200, s);
        return;
      }

      // POST /panic/on
      if (method === "POST" && url === "/panic/on") {
        const out = (await app.runCommand("panic:on", [])) as Json;
        sendJson(res, 200, { ok: true, ...out });
        return;
      }

      // POST /panic/off
      if (method === "POST" && url === "/panic/off") {
        const out = (await app.runCommand("panic:off", [])) as Json;
        sendJson(res, 200, { ok: true, ...out });
        return;
      }

      // ---- Bot endpoint ----
      // POST /bot  { "text": "..." }
      if (method === "POST" && url === "/bot") {
        let body: any = {};
        try {
          body = (await readJsonBody(req)) as Record<string, unknown>;
        } catch (e: any) {
          const code = e?.message === "payload_too_large" ? 413 : 400;
          sendJson(res, code, { ok: false, error: e?.message || "bad_request" });
          return;
        }

        const text = typeof body.text === "string" ? body.text : "";
        if (!text) {
          sendJson(res, 400, { ok: false, error: "text_required" });
          return;
        }

        const replies = (await app.runCommand("bot:send", [text])) as unknown[];
        sendJson(res, 200, { input: text, replies });
        return;
      }

      // Not found
      notFound(res);
    } catch (err: any) {
      app.log.error({ err }, "http handler error");
      sendJson(res, 500, { ok: false, error: "internal_error" });
    }
  });

  const port = Number(process.env.PORT ?? "") > 0 ? Number(process.env.PORT) : 3000;

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      app.log.info({ port }, "http module listening");
      resolve();
    });
  });
}
