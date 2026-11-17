import { beforeAll, afterAll, it, expect } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { readFile } from 'node:fs/promises';
import { randomUUID, createHmac } from 'node:crypto';
import app from '../../src/server/worker';
import { createAuth, type AuthEnvironment } from '../../src/server/auth';
import { largeTable } from '../../src/client/editor/fixtures';
import { TREE_SCHEMA, MOVE_SQL } from '../fixtures/tree-move';

const origin = 'http://localhost:8787';
const secret = 'synthetic-local-tests-only-0123456789abcdef';
let proxy: Awaited<ReturnType<typeof getPlatformProxy<AuthEnvironment>>>;
let env: AuthEnvironment;
function cookie(token = 'alice-session') {
  const signature = createHmac('sha256', secret).update(token).digest('base64');
  return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}
function post(path: string, body: unknown, sessionCookie = cookie(), requestOrigin = origin) {
  return app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: requestOrigin, Cookie: sessionCookie }, body: JSON.stringify(body) }, env);
}

beforeAll(async () => {
  proxy = await getPlatformProxy<AuthEnvironment>({ configPath: 'wrangler.jsonc', persist: false });
  env = { ...proxy.env, APP_ORIGIN: origin, BETTER_AUTH_SECRET: secret, GOOGLE_CLIENT_ID: 'test.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'synthetic-google-secret', PILOT_EMAILS: 'invited@example.test' };
  const migration = await readFile('src/server/db/migrations/0000_lush_elektra.sql', 'utf8');
  for (const statement of migration.split('--> statement-breakpoint')) await env.DB.prepare(statement.trim()).run();
  for (const id of ['alice', 'bob']) {
    await env.DB.prepare('INSERT INTO user(id,name,email,email_verified) VALUES(?,?,?,1)').bind(id, id, `${id}@example.test`).run();
    await env.DB.prepare('INSERT INTO session(id,token,user_id,expires_at,updated_at) VALUES(?,?,?,?,?)').bind(id, `${id}-session`, id, Date.now() + 3600000, Date.now()).run();
  }
});
afterAll(async () => { await proxy?.dispose(); });

it('authenticates signed sessions using Better Auth and local D1', async () => {
  expect((await app.request('/api/spike/session', {}, env)).status).toBe(401);
  const signed = await app.request('/api/spike/session', { headers: { Cookie: cookie() } }, env);
  expect(signed.status).toBe(200);
  expect(await signed.json()).toEqual({ userId: 'alice' });
  expect((await app.request('/api/spike/session', { headers: { Cookie: cookie() + 'bad' } }, env)).status).toBe(401);
});

it('serves the sign-in check with a fresh CSP nonce and no embedded identity', async () => {
  const first = await app.request('/', {}, env);
  const second = await app.request('/', {}, env);
  expect(first.status).toBe(200);
  expect(first.headers.get('Cache-Control')).toBe('no-store');
  expect(first.headers.get('Content-Security-Policy')).toContain("connect-src 'self'");
  expect(first.headers.get('Content-Security-Policy')).not.toBe(second.headers.get('Content-Security-Policy'));
  const html = await first.text();
  expect(html).toContain('Continue with Google');
  expect(html).not.toContain(secret);
  expect(html).not.toContain('alice@example.test');
});

it('saves atomically on D1, retries safely, and rejects stale/cross-owner updates', async () => {
  const id = randomUUID();
  const first = { id, version: 0, mutationId: randomUUID(), document: largeTable };
  const saved = await post('/api/spike/save', first);
  expect(saved.status).toBe(200);
  expect(await saved.json()).toMatchObject({ version: 1 });
  expect(await (await post('/api/spike/save', first)).json()).toMatchObject({ version: 1 });
  const next = { ...first, version: 1, mutationId: randomUUID() };
  expect((await post('/api/spike/save', next, cookie('bob-session'))).status).toBe(409);
  const racing = await Promise.all([
    post('/api/spike/save', next),
    post('/api/spike/save', { ...next, mutationId: randomUUID() }),
  ]);
  expect(racing.map((result) => result.status).sort()).toEqual([200, 409]);
  expect((await post('/api/spike/save', first)).status).toBe(409);
  const stored = await env.DB.prepare('SELECT owner_id,version FROM spike_documents WHERE id=?').bind(id).first();
  expect(stored).toMatchObject({ owner_id: 'alice', version: 2 });
});

it('rejects cross-site mutations, missing sessions, invalid documents, and oversized bodies', async () => {
  expect((await post('/api/spike/save', {}, cookie(), 'https://attacker.example')).status).toBe(403);
  expect((await post('/api/spike/save', {}, '')).status).toBe(401);
  expect((await post('/api/spike/save', { id: randomUUID(), version: 0, mutationId: randomUUID(), document: { type: 'script' } })).status).toBe(400);
  expect((await post('/api/spike/save', { text: 'x'.repeat(300_000) })).status).toBe(413);
});

it('starts Google OAuth with state, and rejects forged callbacks', async () => {
  const response = await post('/api/auth/sign-in/social', { provider: 'google', callbackURL: origin });
  expect(response.status).toBe(200);
  const result = await response.json() as { url: string };
  const url = new URL(result.url);
  expect(url.origin).toBe('https://accounts.google.com');
  expect(url.searchParams.get('state')).toBeTruthy();
  expect(url.searchParams.get('redirect_uri')).toBe(`${origin}/api/auth/callback/google`);
  const callback = await app.request('/api/auth/callback/google?state=forged&code=forged', {}, env);
  expect(callback.headers.get('set-cookie') ?? '').not.toContain('better-auth.session_token=');
  expect(callback.status).toBeGreaterThanOrEqual(300);
});

it('denies uninvited or unverified enrollment in the auth user-creation hook', async () => {
  const auth = createAuth(env);
  const context = await auth.$context;
  const source = { method: 'oauth' as const, oauth: { providerId: 'google' } };
  await expect(context.internalAdapter.createUser({ name: 'Outsider', email: 'outsider@example.test', emailVerified: true }, source)).resolves.toBeNull();
  await expect(context.internalAdapter.createUser({ name: 'Unverified', email: 'invited@example.test', emailVerified: false }, source)).resolves.toBeNull();
  const user = await context.internalAdapter.createUser({ name: 'Invited', email: 'invited@example.test', emailVerified: true }, source);
  expect(user.email).toBe('invited@example.test');
});

it('renders only the supplied validated body and prevents caching or script execution', async () => {
  const response = await post('/api/spike/render', largeTable);
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  const html = await response.text();
  expect(html.match(/<tr>/g)).toHaveLength(101);
  expect(html).not.toContain('<script');
  expect(html).not.toContain('alice@example.test');
});

it('revokes sessions immediately without a session cookie cache', async () => {
  await env.DB.prepare('DELETE FROM session WHERE user_id=?').bind('bob').run();
  expect((await app.request('/api/spike/session', { headers: { Cookie: cookie('bob-session') } }, env)).status).toBe(401);
});

it('enforces same-owner nesting and rejects cycles, including competing moves on D1', async () => {
  await env.DB.prepare(TREE_SCHEMA).run();
  for (const [owner, id] of [['alice', 'a'], ['alice', 'b'], ['bob', 'private']]) {
    await env.DB.prepare('INSERT INTO feasibility_tree(owner_id,id) VALUES(?,?)').bind(owner, id).run();
  }
  const move = (id: string, parent: string) => env.DB.prepare(MOVE_SQL).bind('alice', id, parent).all();
  expect((await move('a', 'a')).results).toHaveLength(0);
  expect((await move('a', 'private')).results).toHaveLength(0);
  const results = await Promise.all([move('a', 'b'), move('b', 'a')]);
  expect(results.map((result) => result.results.length).sort()).toEqual([0, 1]);
  let parent = (await env.DB.prepare("SELECT id FROM feasibility_tree WHERE owner_id='alice' AND parent_id IS NOT NULL").first<{ id: string }>())!.id;
  const first = parent;
  for (let i = 0; i < 20; i++) {
    const id = `level-${i}`;
    await env.DB.prepare('INSERT INTO feasibility_tree(owner_id,id,parent_id) VALUES(?,?,?)').bind('alice', id, parent).run();
    parent = id;
  }
  expect((await move(first, parent)).results).toHaveLength(0);
});
