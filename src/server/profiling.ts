import { AsyncLocalStorage } from 'node:async_hooks';
import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';

type Phase = 'auth' | 'validate' | 'save' | 'render' | 'db';
type Profile = { durations: Partial<Record<Phase, number>>; databaseCalls: number; totalMs: number };
const active = new AsyncLocalStorage<Profile>();

// Diagnostic wall-clock timings only. Worker clocks are coarse outside I/O;
// request CPU must still come from Cloudflare metrics. No request data is stored.
export async function profileRequest(work: () => Promise<void>) {
  const profile: Profile = { durations: {}, databaseCalls: 0, totalMs: 0 };
  const start = performance.now();
  await active.run(profile, work);
  profile.totalMs = performance.now() - start;
  return profile;
}

export async function timed<T>(phase: Phase, work: () => T | Promise<T>): Promise<T> {
  const profile = active.getStore();
  if (!profile) return work();
  const start = performance.now();
  try { return await work(); }
  finally { profile.durations[phase] = (profile.durations[phase] ?? 0) + performance.now() - start; }
}

export function timingHeader(profile: Profile) {
  return [...Object.entries(profile.durations).map(([name, duration]) => `${name};dur=${duration.toFixed(2)}`), `total;dur=${profile.totalMs.toFixed(2)}`].join(', ');
}

const databases = new WeakMap<D1Database, D1Database>();
export function profileDatabase(database: D1Database): D1Database {
  const previous = databases.get(database);
  if (previous) return previous;
  const wrap = (statement: D1PreparedStatement): D1PreparedStatement => new Proxy(statement, {
    get(target, key) {
      if (key === 'bind') return (...args: unknown[]) => wrap(target.bind(...args));
      const member = Reflect.get(target, key, target);
      if (['all', 'raw', 'first', 'run'].includes(String(key))) return (...args: unknown[]) => {
        const profile = active.getStore();
        if (profile) profile.databaseCalls++;
        return timed('db', () => member.apply(target, args));
      };
      return typeof member === 'function' ? member.bind(target) : member;
    },
  });
  const profiled = new Proxy(database, { get(target, key) {
    if (key === 'prepare') return (sql: string) => wrap(target.prepare(sql));
    const member = Reflect.get(target, key, target);
    return typeof member === 'function' ? member.bind(target) : member;
  } });
  databases.set(database, profiled);
  return profiled;
}
