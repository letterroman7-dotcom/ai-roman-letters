import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            singleLine: true,
            colorize: true
          }
        }
      })
});

export default logger;
