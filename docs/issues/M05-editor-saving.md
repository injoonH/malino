## Outcome

A non-developer can write, format, and save a note without learning Markdown or losing edits during a connection failure. Depends on M02, M03, and M04.

## Acceptance criteria

- [ ] Required formatting, lists, simple tables, and HTTPS image URL previews have visible controls.
- [ ] Optional Markdown shortcuts, undo/redo, paste sanitization, keyboard use, and Korean IME work.
- [ ] Editor input avoids whole-app rerenders and per-keystroke network traffic; agreed budgets measured.
- [ ] Account/page-scoped IndexedDB drafts recover after reload where storage remains available; failures are visible.
- [ ] Bounded coalescing/retry queue, version-checked atomic writes, retry IDs, and correct save indicators.
- [ ] Conflicting edits retain both versions; delayed acknowledgments cannot clear newer edits.
- [ ] Disconnect, failed requests, quota errors, expired sessions, tab/device conflicts, logout, and account switching tested.
- [ ] Invalid or oversized documents are rejected clearly without truncation.

Full offline navigation/creation and CRDT collaboration are outside scope.
