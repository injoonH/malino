Published as [draft PR #10](https://github.com/injoonH/malino/pull/10).

# Proposed title

Validate malino editor and hosted Cloudflare feasibility

# Proposed body

malino needs a fast visual editor and reliable private note storage before the full app is built. This change adds a Svelte/Tiptap editor preview with formatting controls, simple tables, URL images, Korean/English labels, Markdown conversion, and IndexedDB draft recovery. Editor and conversion code load separately to keep the shell small.

A separate Hono Worker test app uses Better Auth, Drizzle, and D1 to exercise signed sessions, invite restrictions, atomic versioned saves, retries, and safe public HTML rendering. Disposable D1 tests also prove that guarded recursive tree moves reject cycles under concurrent requests. The preview stores only local drafts; it is not connected to a production account or note service.

Validation: type checking; 28 unit/SQLite tests; nine local D1/auth integration tests; seven Chromium browser checks; production bundle analysis; Worker dry-run build. Local editor-ready JavaScript is approximately 157 KiB gzip. Full timing methodology and caveats are in `docs/feasibility.md`.

A dedicated invite-restricted test Worker is deployed. On 2026-11-18, real Google sign-in and 20 authenticated save/render requests succeeded. Normal save median/max was 707/748 ms, near-limit save median/max 1,096/1,712 ms (five samples each). Raw browser reports and Cloudflare aggregates are preserved in `docs/measurements/`.

Hosting remains undecided: benchmark CPU p95 was 11.294 ms against the 10 ms Free budget, despite zero runtime errors. Issue #11 tracks CPU headroom, latency, and unreconciled D1 accounting. Negative live auth checks, bounded quota failures, and real Korean IME/mobile tests remain. Keep #2 open until the live gates pass.

Related to #2; keep it open until the live acceptance criteria pass. Requirements, architecture alternatives, security considerations, and links to all nine work items are included for handoff.
