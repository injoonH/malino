> Historical planning-only draft. Planning is now included in the feasibility PR described in [feasibility-pr.md](feasibility-pr.md); do not open this as a duplicate PR.

# Proposed title

Document malino requirements, architecture options, and implementation backlog

# Proposed body

malino starts as an empty repository. This change records the agreed first release: a fast visual note editor for non-developers, Google sign-in, private nested pages, simple tables, URL image previews, selected-page public read-only links, and recovery of unsent edits. The initial pilot is invite-only for approximately ten users in Korea, with Korean and English interfaces.

The plan proposes TypeScript/Svelte, Tiptap, Hono, Better Auth, and SQLite-compatible persistence. Cloudflare Free is the preferred host only after authentication, saving, public rendering, quotas, and Korea latency pass a feasibility test; Raspberry Pi/Docker Compose is the fallback. It documents alternatives, security boundaries, release gates, and issue drafts for implementation.

Validation: documentation link and formatting checks. No application code, runtime validation, deployment, or performance results are included. Technical choices marked proposed remain subject to discussion and the feasibility spike.

Link the published planning issue before submitting this PR. This is a local draft; no PR has been opened.
