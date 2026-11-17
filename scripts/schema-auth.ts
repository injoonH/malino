import { betterAuth } from 'better-auth';

// Schema generation only. These placeholders are never used by the Worker.
export const auth = betterAuth({
  baseURL: 'http://localhost:8787',
  secret: 'schema-generation-only-not-a-runtime-secret',
  socialProviders: { google: { clientId: 'schema-only', clientSecret: 'schema-only' } },
  rateLimit: { enabled: true, storage: 'database' },
});
