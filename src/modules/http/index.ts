import type { App } from "../../types/app.js";
import http from "node:http";

export default async function registerHttp(app: App) {
  const port = Number(process.env.PORT || 3000);

  const server = http.createServer(async (req, res) => {
    try {
      // CORS / JSON headers
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method === "GET" && req.url === "/") {
        const body = JSON.stringify({
          ok: true,
          name: app.name,
          env: app.env,
          cmds: app.listCommands(),
        });
        res.statusCode = 200;
        res.end(body);
        return;
      }

      if (req.method === "GET" && req.url === "/health") {
        const health = (await app.runCommand("health", [])) as unknown;
        res.statusCode = 200;
        res.end(JSON.stringify(health));
        return;
      }

      if (req.method === "POST" && req.url === "/bot") {
        const raw = await new Promise<string>((resolve, reject) => {
          let data = "";
          req.on("data", (c) => (data += c));
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });

        let body: any = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          // ignore: will fall through to validation error below
        }

        const text = typeof body?.text === "string" ? body.text : "";
        if (!text) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing { text }" }));
          return;
        }

        const replies = (await app.runCommand("bot:send", [text])) as unknown;
        res.statusCode = 200;
        res.end(JSON.stringify({ input: text, replies }));
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not Found" }));
    } catch (err) {
      app.log.error({ err }, "http handler error");
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      app.log.info({ port }, "http module listening");
      resolve();
    });
  });
}
