import { it, expect } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import { createHmac } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createAuth, type AuthEnvironment } from '../../src/server/auth';
import type { D1PreparedStatement } from '@cloudflare/workers-types';

// Diagnostic only: Node CPU and local D1 latency are not deployed Worker CPU.
it('measures fresh versus reused authentication and counts database round trips', async () => {
  const proxy = await getPlatformProxy<AuthEnvironment>({ configPath: 'wrangler.jsonc', persist: false });
  try {
    for (const sql of (await readFile('src/server/db/migrations/0000_lush_elektra.sql', 'utf8')).split('--> statement-breakpoint')) {
      await proxy.env.DB.prepare(sql.trim()).run();
    }
    const secret = 'synthetic-profile-only-0123456789abcdef';
    await proxy.env.DB.prepare("INSERT INTO user(id,name,email,email_verified) VALUES('profile','Profile','profile@example.test',1)").run();
    await proxy.env.DB.prepare("INSERT INTO session(id,token,user_id,expires_at,updated_at) VALUES('profile','profile-token','profile',?,?)").bind(Date.now() + 3600000, Date.now()).run();
    let queries = 0;
    const wrap = (statement: D1PreparedStatement): D1PreparedStatement => new Proxy(statement, {
      get(target, key) {
        if (key === 'bind') return (...args: unknown[]) => wrap(target.bind(...args));
        const member = Reflect.get(target, key, target);
        if (['all', 'raw', 'first', 'run'].includes(String(key))) return (...args: unknown[]) => { queries++; return member.apply(target, args); };
        return typeof member === 'function' ? member.bind(target) : member;
      },
    });
    const db = new Proxy(proxy.env.DB, { get(target, key) {
      if (key === 'prepare') return (sql: string) => wrap(target.prepare(sql));
      const member = Reflect.get(target, key, target);
      return typeof member === 'function' ? member.bind(target) : member;
    } });
    const env: AuthEnvironment = { ...proxy.env, DB: db, APP_ORIGIN: 'http://localhost:8787', BETTER_AUTH_SECRET: secret, GOOGLE_CLIENT_ID: 'test.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'synthetic', PILOT_EMAILS: 'profile@example.test' };
    const signature = createHmac('sha256', secret).update('profile-token').digest('base64');
    const headers = new Headers({ Cookie: `better-auth.session_token=${encodeURIComponent(`profile-token.${signature}`)}` });
    const report: Record<string, unknown> = { measuredAt: new Date().toISOString(), node: process.version, scope: 'Node process CPU and disposable local D1; not deployed Worker CPU', warmup: 10, samples: 40 };
    for (const mode of ['fresh', 'reused']) {
      const shared = createAuth(env);
      const samples: { wallMs: number; nodeCpuMs: number; queries: number }[] = [];
      for (let i = 0; i < 50; i++) {
        queries = 0;
        const before = process.cpuUsage(); const start = performance.now();
        const auth = mode === 'fresh' ? createAuth(env) : shared;
        const session = await auth.api.getSession({ headers });
        const cpu = process.cpuUsage(before);
        expect(session?.user.id).toBe('profile');
        if (i >= 10) samples.push({ wallMs: performance.now() - start, nodeCpuMs: (cpu.user + cpu.system) / 1000, queries });
      }
      const percentile = (field: 'wallMs' | 'nodeCpuMs', p: number) => samples.map(s => s[field]).sort((a, b) => a - b)[Math.ceil(samples.length * p) - 1];
      report[mode] = { wallP50Ms: percentile('wallMs', .5), wallP95Ms: percentile('wallMs', .95), nodeCpuP50Ms: percentile('nodeCpuMs', .5), nodeCpuP95Ms: percentile('nodeCpuMs', .95), queriesPerSession: [...new Set(samples.map(s => s.queries))], samples };
    }
    await mkdir('artifacts', { recursive: true });
    const label = process.env.MALINO_PROFILE_LABEL === 'baseline' ? 'baseline' : 'optimized';
    await writeFile(`artifacts/auth-profile-${label}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([key, value]) => [key, value && typeof value === 'object' ? { ...value, samples: undefined } : value])), null, 2));
  } finally { await proxy.dispose(); }
});
