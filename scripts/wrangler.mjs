import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

await mkdir('artifacts/wrangler-logs', { recursive: true });
// Keep tool logs in the project instead of requiring writes to the user's home directory.
const child = spawn(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: resolve('artifacts/wrangler-logs') },
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
