import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { getAuth, type AuthEnvironment } from './auth';
import { parseDocument } from '../shared/document';
import { renderPublicDocument } from './public-render';
import { saveDocument } from './save';
import { feasibilityPage } from './feasibility-page';
import { profileDatabase, profileRequest, timed, timingHeader } from './profiling';

function authFor(env: AuthEnvironment) {
  return getAuth({ ...env, DB: profileDatabase(env.DB) });
}

const app = new Hono<{ Bindings: AuthEnvironment }>();
app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  await next();
});
app.get('/health', (c) => c.json({ status: 'ok', purpose: 'malino-feasibility' }));
app.get('/', (c) => {
  const nonce = crypto.randomUUID();
  c.header('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
  c.header('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return c.html(feasibilityPage(nonce));
});
app.use('/api/*', bodyLimit({ maxSize: 270 * 1024, onError: (c) => c.json({ error: 'Payload too large' }, 413) }));
app.use('/api/*', async (c, next) => {
  const profile = await profileRequest(next);
  c.header('Server-Timing', timingHeader(profile));
  c.header('X-Malino-DB-Calls', String(profile.databaseCalls));
});
app.all('/api/auth/*', (c) => timed('auth', () => authFor(c.env).handler(c.req.raw)));
app.use('/api/spike/*', async (c, next) => {
  if (c.req.method !== 'GET' && (c.req.header('Origin') !== c.env.APP_ORIGIN || !c.req.header('Content-Type')?.startsWith('application/json'))) {
    return c.json({ error: 'Untrusted request' }, 403);
  }
  await next();
});
app.get('/api/spike/session', async (c) => {
  const session = await timed('auth', () => authFor(c.env).api.getSession({ headers: c.req.raw.headers }));
  return session ? c.json({ userId: session.user.id }) : c.json({ error: 'Sign in required' }, 401);
});

const saveInput = z.object({ id: z.string().uuid(), version: z.number().int().nonnegative(), mutationId: z.string().uuid(), document: z.unknown() }).strict();
app.post('/api/spike/save', async (c) => {
  const session = await timed('auth', () => authFor(c.env).api.getSession({ headers: c.req.raw.headers }));
  if (!session) return c.json({ error: 'Sign in required' }, 401);
  const input = saveInput.safeParse(await c.req.json());
  if (!input.success) return c.json({ error: 'Invalid save request' }, 400);
  const { id, version, mutationId } = input.data;
  let document;
  try { document = await timed('validate', () => JSON.stringify(parseDocument(input.data.document))); }
  catch { return c.json({ error: 'Invalid document' }, 400); }
  const saved = await timed('save', () => saveDocument(profileDatabase(c.env.DB), session.user.id, id, version, mutationId, document));
  return saved ? c.json(saved) : c.json({ error: 'Version conflict' }, 409);
});

// Authenticated render benchmark; no public grant or real sharing is exposed by this spike.
app.post('/api/spike/render', async (c) => {
  const session = await timed('auth', () => authFor(c.env).api.getSession({ headers: c.req.raw.headers }));
  if (!session) return c.json({ error: 'Sign in required' }, 401);
  try {
    const input = await c.req.json();
    const html = await timed('render', () => renderPublicDocument(input));
    c.header('Content-Security-Policy', "default-src 'none'; img-src https:; style-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    c.header('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return c.html(`<!doctype html><meta charset="utf-8"><title>malino render benchmark</title><main>${html}</main>`);
  } catch { return c.json({ error: 'Invalid document' }, 400); }
});
app.onError((_error, c) => c.json({ error: 'Feasibility service unavailable; check server configuration.' }, 503));
export default app;
