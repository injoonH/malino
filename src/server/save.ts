import type { D1Database } from '@cloudflare/workers-types';

export const SAVE_SQL = `
  INSERT INTO spike_documents(owner_id, id, version, mutation_id, document)
  SELECT ?1, ?2, 1, ?3, ?4 WHERE ?5 = 0 OR EXISTS (
    SELECT 1 FROM spike_documents WHERE owner_id = ?1 AND id = ?2
  )
  ON CONFLICT(owner_id, id) DO UPDATE SET
    version = version + 1, mutation_id = ?3, document = ?4
  WHERE version = ?5 AND mutation_id <> ?3
  RETURNING version
`;
export const RETRY_SQL = `SELECT version FROM spike_documents
  WHERE owner_id = ?1 AND id = ?2 AND mutation_id = ?3 AND document = ?4`;

export async function saveDocument(db: D1Database, ownerId: string, id: string, version: number, mutationId: string, document: string) {
  const result = await db.prepare(SAVE_SQL).bind(ownerId, id, mutationId, document, version).all<{ version: number }>();
  if (result.results.length) return { version: result.results[0].version, rowsRead: result.meta.rows_read, rowsWritten: result.meta.rows_written };
  // A retry must have identical content and be the latest mutation. Never rewrite on retry.
  const retry = await db.prepare(RETRY_SQL).bind(ownerId, id, mutationId, document).all<{ version: number }>();
  return retry.results.length ? { version: retry.results[0].version, rowsRead: result.meta.rows_read + retry.meta.rows_read, rowsWritten: result.meta.rows_written } : null;
}
