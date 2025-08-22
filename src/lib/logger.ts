import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? "info";

// Pretty in dev, JSON in prod
export const logger = pino({
  level,
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            singleLine: true,
            translateTime: 'UTC:yyyy-mm-dd"T"HH:MM:ss.l"Z"',
            ignore: "pid,hostname",
          },
        },
      }),
});
