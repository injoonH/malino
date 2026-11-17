## Outcome

Users can take their notes elsewhere, and the operator can recover from data loss. Depends on M04 and M05.

## Acceptance criteria

- [ ] Markdown import/export for the agreed subset, including nested lists, Korean text, tables, code, and URL images.
- [ ] Structured export is lossless and versioned; hierarchy is retained in a manifest/layout.
- [ ] Import validates sizes/schema and reports unsupported constructs without silent content loss.
- [ ] Exports enforce ownership, bounded work, and safe generated filenames.
- [ ] Backup job and retention match the chosen deployment; off-provider/off-device copy is protected.
- [ ] Restore into an isolated environment is demonstrated and documented, including deletion records.
- [ ] Account deletion and backup retention behavior are documented and tested.

Do not treat local browser drafts, D1 Time Travel alone, or an unsafe copy of a live SQLite database as a complete backup strategy.
