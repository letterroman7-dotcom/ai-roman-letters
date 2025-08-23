﻿// src/utils/logger.ts
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? "info";

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
            colorize: true,
          },
        },
      }),
});
