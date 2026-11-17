import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from './db/auth-schema';

export type AuthEnvironment = {
  DB: D1Database;
  APP_ORIGIN: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  PILOT_EMAILS: string;
};

export function createAuth(env: AuthEnvironment) {
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32 || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Authentication secrets are not configured.');
  }
  const origin = new URL(env.APP_ORIGIN);
  if (origin.origin !== env.APP_ORIGIN || (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname))) {
    throw new Error('APP_ORIGIN must be a fixed HTTPS origin (or local development origin).');
  }
  const invited = new Set((env.PILOT_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean));
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB, { schema }), { provider: 'sqlite', schema }),
    baseURL: env.APP_ORIGIN,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_ORIGIN],
    emailAndPassword: { enabled: false },
    socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, scope: ['openid', 'email', 'profile'] } },
    account: { encryptOAuthTokens: true, accountLinking: { enabled: false } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 30 },
    advanced: {
      database: { joins: true },
      useSecureCookies: origin.protocol === 'https:',
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' },
    },
    databaseHooks: {
      user: { create: { before: async (user) => user.emailVerified && invited.has(user.email.toLowerCase()) ? undefined : false } },
    },
    logger: { disabled: true },
    telemetry: { enabled: false },
  });
}

// Reuse immutable auth configuration, never session results. Bindings/configuration
// changes replace the instance so secret rotation and invite changes take effect.
const instances = new WeakMap<D1Database, { config: string[]; auth: ReturnType<typeof createAuth> }>();
export function getAuth(env: AuthEnvironment) {
  const config = [env.APP_ORIGIN, env.BETTER_AUTH_SECRET, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.PILOT_EMAILS];
  const previous = instances.get(env.DB);
  if (previous && previous.config.every((value, index) => value === config[index])) return previous.auth;
  const auth = createAuth(env);
  instances.set(env.DB, { config, auth });
  return auth;
}
