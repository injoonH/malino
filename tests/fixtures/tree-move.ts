// Feasibility proof only; full tree routes, ordering, depth limits, and trash are M04.
export const TREE_SCHEMA = `CREATE TABLE feasibility_tree (
  owner_id TEXT NOT NULL,
  id TEXT NOT NULL,
  parent_id TEXT,
  PRIMARY KEY(owner_id, id),
  FOREIGN KEY(owner_id, parent_id) REFERENCES feasibility_tree(owner_id, id)
)`;

export const MOVE_SQL = `
WITH RECURSIVE descendants(id) AS (
  SELECT id FROM feasibility_tree WHERE owner_id=?1 AND id=?2
  UNION ALL
  SELECT p.id FROM feasibility_tree p JOIN descendants d ON p.parent_id=d.id WHERE p.owner_id=?1
)
UPDATE feasibility_tree SET parent_id=?3
WHERE owner_id=?1 AND id=?2
  AND (?3 IS NULL OR EXISTS(SELECT 1 FROM feasibility_tree WHERE owner_id=?1 AND id=?3))
  AND NOT EXISTS(SELECT 1 FROM descendants WHERE id=?3)
RETURNING id
`;
