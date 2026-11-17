import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: ['./src/server/db/auth-schema.ts', './src/server/db/spike-schema.ts'],
  out: './src/server/db/migrations',
});
