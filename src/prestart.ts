import 'dotenv/config';

// ASCII-only banner to avoid mojibake on Windows terminals.
const appName = process.env.APP_NAME || 'ai-bot';
const logLevel = process.env.LOG_LEVEL || 'info';
const env = process.env.NODE_ENV || 'development';

const now = new Date().toISOString();
const meta = JSON.stringify({ env, app: appName, logLevel });

console.log(`[${now}] INFO: ${appName} project: booting... ${meta}`);
