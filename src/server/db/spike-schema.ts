import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

// Synthetic feasibility documents only. The full page tree belongs to M04.
export const spikeDocuments = sqliteTable('spike_documents', {
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  id: text('id').notNull(),
  version: integer('version').notNull().default(0),
  mutationId: text('mutation_id').notNull(),
  document: text('document').notNull(),
}, (table) => [primaryKey({ columns: [table.ownerId, table.id] })]);
