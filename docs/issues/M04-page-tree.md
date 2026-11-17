## Outcome

Users can organize their own notes into nested pages safely and quickly. Depends on M03.

## Acceptance criteria

- [ ] Create, rename, reorder, move, trash, restore, and title-search pages in an owner-scoped tree.
- [ ] Sidebar uses metadata-only bounded reads; bodies load when opened.
- [ ] Enforce same-owner parents and prevent cycles, including racing move requests.
- [ ] Menu-based organization is keyboard accessible; errors explain depth/size limits without losing work.
- [ ] Subtree trash/restore uses a deletion batch and handles missing parents without reviving unrelated deleted notes.
- [ ] Tests cover cross-user access, descendant moves, concurrent structural changes, pagination, and restoration.
- [ ] Confirm behavior with the agreed 1,000-page and nesting fixtures.

Add no collaborative workspace or database-view feature.
