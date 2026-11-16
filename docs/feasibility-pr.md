# Proposed title

Validate malino editor and hosted Cloudflare feasibility

# Proposed body

malino needs a fast visual editor and reliable private note storage before the full app is built. This change adds a Svelte/Tiptap editor preview with formatting controls, simple tables, URL images, Korean/English labels, Markdown conversion, and IndexedDB draft recovery. Editor and conversion code load separately to keep the shell small.

A separate Hono Worker test app uses Better Auth, Drizzle, and D1 to exercise signed sessions, invite restrictions, atomic versioned saves, retries, and safe public HTML rendering. Disposable D1 tests also prove that guarded recursive tree moves reject cycles under concurrent requests. The preview stores only local drafts; it is not connected to a production account or note service.

Validation: type checking; 28 unit/SQLite tests; nine local D1/auth integration tests; seven Chromium browser checks; production bundle analysis; Worker dry-run build. Local editor-ready JavaScript is approximately 157 KiB gzip. Full timing methodology and caveats are in `docs/feasibility.md`.

Remaining gates: real Google OAuth exchange, independent account quota verification, deployed CPU and quota measurements, Korea latency, and real Korean IME/mobile hardware testing. A dedicated invite-restricted test Worker is deployed; its health and Google authorization initiation pass. The real Google callback is pending phone verification. No final hosting decision is included. Keep the feasibility issue open until these pass.

Related to #2; keep it open until the live acceptance criteria pass. Requirements, architecture alternatives, security considerations, and links to all nine work items are included for handoff.
