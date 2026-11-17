import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

process.env.WRANGLER_LOG_PATH = resolve('artifacts/wrangler-logs');
process.env.WRANGLER_SEND_METRICS = 'false';

export default defineConfig({
  test: { include: ['tests/profiling/**/*.test.ts'], environment: 'node', testTimeout: 120000, hookTimeout: 30000, fileParallelism: false },
});
