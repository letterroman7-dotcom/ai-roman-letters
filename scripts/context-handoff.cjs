// scripts/context-handoff.cjs
// Robust context handoff writer for A`I project (Windows-friendly)

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// ---------- Load .env early so process.env has values ----------
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    require('dotenv').config();
  }
  // Optional: log once (non-noisy)
  console.log(`[dotenv@${require('dotenv/package.json').version}] injecting env from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }`);
} catch (_) {
  // continue silently if dotenv is missing
}

// ---------- Helpers ----------
const exists = (p) => {
  try { return fs.existsSync(p); } catch { return false; }
};

function readPackageSafe(pkgPath) {
  // 1) Try require (CommonJS can still require JSON in Node 22)
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const pkg = require(pkgPath);
    return { pkg, error: null };
  } catch (e1) {
    // 2) Fallback to fs + JSON.parse for more precise error
    try {
      const raw = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(raw);
      return { pkg, error: null };
    } catch (e2) {
      return { pkg: null, error: (e1 && e1.message) ? `${e1.message}; ${e2.message}` : (e2.message || 'unknown error') };
    }
  }
}

// ---------- Paths ----------
const cwd = process.cwd();
const distIndex = path.join(cwd, 'dist', 'index.js');
const bootstrap = path.join(cwd, 'dist', 'bootstrap.js');
const diagQuick = path.join(cwd, 'dist', 'diagnostics', 'quick.js');
const diagFull  = path.join(cwd, 'dist', 'diagnostics', 'full.js');
const panicLock = path.join(cwd, 'data', 'guardian', 'panic.lock');
const pkgPath   = path.join(cwd, 'package.json');

// ---------- Gather ----------
const npmUA = process.env.npm_config_user_agent || '';
const npmVersionMatch = npmUA.match(/npm\/([0-9.]+)/);
const npmVersion = npmVersionMatch ? npmVersionMatch[1] : null;

const { pkg, error: pkgErr } = readPackageSafe(pkgPath);

const payload = {
  when: new Date().toISOString(),
  system: {
    node: process.version,
    npm: npmVersion,
    os: `${os.platform()} ${os.arch()}`,
    release: os.release()
  },
  paths: {
    cwd,
    distIndex,
    bootstrap,
    diagQuick,
    diagFull
  },
  existence: {
    env: exists(path.join(cwd, '.env')),
    envExample: exists(path.join(cwd, '.env.example')),
    distIndex: exists(distIndex),
    panicLockFile: exists(panicLock)
  },
  env: {
    APP_NAME: process.env.APP_NAME ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null
  },
  packageJson: pkg,
  packageJsonError: pkg ? null : (pkgErr || null)
};

// ---------- Write handoff ----------
const outDir = path.join(cwd, '.handoff');
const outFile = path.join(outDir, 'context.json');

try {
  if (!exists(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');

  const summary = [
    `handoff written: ${outFile}`,
    'summary:',
    `  node: ${payload.system.node}`,
    `  npm : ${payload.system.npm ?? 'unknown'}`,
    `  cwd : ${cwd}`,
    `  dist index present: ${payload.existence.distIndex ? 'true' : 'false'}`
  ].join('\n');

  console.log(summary);

  if (!pkg) {
    console.warn(`[handoff] ⚠️  package.json could not be parsed. Error: ${payload.packageJsonError}`);
    console.warn(`[handoff] Tip: ensure ${pkgPath} exists and contains valid JSON (no trailing commas/comments).`);
  }
} catch (err) {
  console.error('Failed to write handoff:', err?.message || err);
  process.exitCode = 1;
}
