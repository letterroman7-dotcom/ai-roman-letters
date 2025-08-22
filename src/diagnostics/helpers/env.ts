import { promises as fs } from "node:fs";
import path from "node:path";

async function readFileIfExists(p: string): Promise<string | null> {
  try { return await fs.readFile(p, "utf8"); } catch { return null; }
}

function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of content.split(/\r?\n/)) {
    if (!raw || /^\s*#/.test(raw)) continue;
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    // strip surrounding quotes
    val = val.replace(/^(['"])(.*)\1$/, "$2");
    out[key] = val;
  }
  return out;
}

export async function readDotEnv(cwd: string) {
  const envPath = path.join(cwd, ".env");
  const examplePath = path.join(cwd, ".env.example");
  const envContent = await readFileIfExists(envPath);
  const exampleContent = await readFileIfExists(examplePath);
  const envVars = envContent ? parseDotEnv(envContent) : {};
  const exampleVars = exampleContent ? parseDotEnv(exampleContent) : {};
  return {
    env: { path: envPath, exists: envContent != null, vars: envVars },
    example: { path: examplePath, exists: exampleContent != null, vars: exampleVars },
  };
}

export async function summarizeAppNames(cwd: string) {
  const pkgPath = path.join(cwd, "package.json");
  let pkgName = "";
  try {
    const raw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    pkgName = pkg?.name ?? "";
  } catch { /* ignore */ }

  const { env } = await readDotEnv(cwd);
  const APP_NAME = env.vars.APP_NAME ?? "";
  const PROJECT_NAME = env.vars.PROJECT_NAME ?? "";

  return {
    APP_NAME: APP_NAME || PROJECT_NAME || pkgName || "",
    from: {
      env: APP_NAME || PROJECT_NAME || "",
      packageJson: pkgName,
    },
  };
}
