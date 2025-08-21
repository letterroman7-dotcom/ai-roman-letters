import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("A`I Bot"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  KILL_SWITCH: z
    .string()
    .optional()
    .transform((v) => String(v ?? "false").toLowerCase() === "true"),
  FEATURE_FLAGS: z.string().default(""),

  AUDIT_TO_FILE: z
    .string()
    .optional()
    .transform((v) => String(v ?? "false").toLowerCase() === "true"),
  AUDIT_DIR: z.string().default("data/logs"),

  ACTION_CONCURRENCY: z.coerce.number().default(4),
  ACTION_RATE_MAX: z.coerce.number().default(20),
  ACTION_RATE_INTERVAL_MS: z.coerce.number().default(1000),

  MODULES: z.string().default("health")
});

type Env = z.infer<typeof EnvSchema>;

export interface AppConfig {
  env: Env["NODE_ENV"];
  appName: string;
  logLevel: Env["LOG_LEVEL"];
  killSwitch: boolean;
  flags: Set<string>;
  auditToFile: boolean;
  auditDir: string;
  action: {
    concurrency: number;
    rateMax: number;
    rateIntervalMs: number;
  };
  modules: string[];
}

function parseFlags(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

const parsed = EnvSchema.parse(process.env);

const config: AppConfig = {
  env: parsed.NODE_ENV,
  appName: parsed.APP_NAME,
  logLevel: parsed.LOG_LEVEL,
  killSwitch: parsed.KILL_SWITCH,
  flags: parseFlags(parsed.FEATURE_FLAGS),
  auditToFile: parsed.AUDIT_TO_FILE,
  auditDir: parsed.AUDIT_DIR,
  action: {
    concurrency: parsed.ACTION_CONCURRENCY,
    rateMax: parsed.ACTION_RATE_MAX,
    rateIntervalMs: parsed.ACTION_RATE_INTERVAL_MS
  },
  modules: parsed.MODULES.split(",").map((s) => s.trim()).filter(Boolean)
};

export default config;
