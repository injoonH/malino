// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SAVE_SQL, RETRY_SQL } from '../../src/server/save';
import { renderPublicDocument } from '../../src/server/public-render';
import { parseDocument } from '../../src/shared/document';
import { largeNote, largeTable } from '../../src/client/editor/fixtures';

let db: DatabaseSync;
beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec(readFileSync('src/server/db/migrations/0000_lush_elektra.sql', 'utf8'));
  db.exec("INSERT INTO user(id,name,email,email_verified) VALUES ('alice','Alice','alice@example.test',1),('bob','Bob','bob@example.test',1)");
});
afterEach(() => db.close());
function save(owner: string, id: string, version: number, mutation: string, content: string) {
  return db.prepare(SAVE_SQL).get(owner, id, mutation, content, version) ?? db.prepare(RETRY_SQL).get(owner, id, mutation, content);
}

describe('atomic save SQL against real SQLite', () => {
  it('creates, advances, and rejects stale writes', () => {
    expect(save('alice', 'note', 0, 'm1', 'first')?.version).toBe(1);
    expect(save('alice', 'note', 1, 'm2', 'second')?.version).toBe(2);
    expect(save('alice', 'note', 1, 'm3', 'stale')).toBeUndefined();
    expect(db.prepare('SELECT document FROM spike_documents').get()?.document).toBe('second');
  });
  it('accepts identical retries without changing the revision', () => {
    save('alice', 'note', 0, 'm1', 'first');
    expect(save('alice', 'note', 0, 'm1', 'first')?.version).toBe(1);
    expect(save('alice', 'note', 1, 'm1', 'tampered')).toBeUndefined();
    expect(db.prepare('SELECT document FROM spike_documents').get()?.document).toBe('first');
  });
  it('rejects old retries after a newer save', () => {
    save('alice', 'note', 0, 'm1', 'first'); save('alice', 'note', 1, 'm2', 'second');
    expect(save('alice', 'note', 0, 'm1', 'first')).toBeUndefined();
  });
  it('isolates owners and does not create a missing page at a nonzero revision', () => {
    save('alice', 'note', 0, 'm1', 'private');
    expect(save('bob', 'note', 1, 'm2', 'intrusion')).toBeUndefined();
    expect(save('bob', 'note', 0, 'm3', 'independent')?.version).toBe(1);
    expect(db.prepare("SELECT document FROM spike_documents WHERE owner_id='alice'").get()?.document).toBe('private');
  });
  it('uses an index for the owner/page lookup', () => {
    const plan = db.prepare('EXPLAIN QUERY PLAN SELECT version FROM spike_documents WHERE owner_id=? AND id=?').all('alice', 'note');
    expect(plan.map((row) => row.detail).join(' ')).toContain('USING INDEX');
  });
});

describe('server validation and safe public rendering', () => {
  it('validates both performance documents and renders without an editor runtime', () => {
    expect(parseDocument(largeNote).content).toHaveLength(100);
    expect(renderPublicDocument(largeTable).match(/<tr>/g)).toHaveLength(101);
  });
  it('escapes text and image attributes', () => {
    expect(renderPublicDocument({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '<script>alert("x")</script>' }] }] })).toBe('<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>');
    expect(renderPublicDocument({ type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.com/a.png', alt: '\" onerror=\"bad' } }] })).not.toContain('alt="" onerror=');
  });
  it('rejects malformed structure, unsafe links, and oversized documents', () => {
    expect(() => parseDocument({ type: 'doc', content: [{ type: 'text', text: 'bad' }] })).toThrow();
    expect(() => renderPublicDocument({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'bad', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] })).toThrow();
    expect(() => parseDocument({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '가'.repeat(100_000) }] }] })).toThrow();
  });
  it('rejects HTML attributes and nested or merged table content', () => {
    expect(() => parseDocument({ type: 'doc', content: [{ type: 'paragraph', attrs: { onclick: 'bad' } }] })).toThrow();
    const table = structuredClone(largeTable);
    table.content![0].content![0].content![0].attrs = { colspan: 2 };
    expect(() => parseDocument(table)).toThrow();
  });
});
