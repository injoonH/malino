# Decision log

Updated 2026-11-16. “Proposed” means no user approval or implementation is implied.

| ID | Status | Decision and reason |
| --- | --- | --- |
| D01 | Confirmed | malino means My Little Note. Fast, lightweight, easy editing is the primary product goal. |
| D02 | Confirmed | Visual editor with formatting buttons and optional Markdown shortcuts, because users need not know Markdown. |
| D03 | Confirmed | Private workspaces with selected-page public read-only links. Children remain private; shared pages are unlisted and excluded from search engines. |
| D04 | Confirmed | Online operation with recovery of unsent edits during connection failures. No full offline app or simultaneous collaboration. |
| D05 | Confirmed | Initial audience approximately ten people in Korea. No programming language preference. Hosting should balance reliability and maintenance; Cloudflare must stay free. |
| D06 | Selected for feasibility | TypeScript across client/API for checked contracts and safe refactoring. Pin TypeScript 6.0.3: current svelte-check requires extra compatibility setup for TypeScript 7, which is unnecessary for this spike. Runtime validation remains necessary. |
| D07 | Locally validated | Svelte 5 and Vite meet the initial bundle budget. Editor code loads separately from the shell; conversion code loads on demand. See measured results in docs/feasibility.md. |
| D08 | Locally validated | Open-source Tiptap/ProseMirror passes the supported round-trip fixtures, table/browser tests, and local timing checks. Real Korean IME and mobile hardware tests remain. Markdown extension beta status still warrants targeted regression tests. |
| D09 | Confirmed semantics | Structured editor data is canonical, with Markdown import/export. The user accepts normalization of original Markdown syntax and spacing on export. Versioned JSON and the exact supported conversion subset remain implementation details to validate. |
| D10 | Locally validated | Hono, Better Auth, and Drizzle work with disposable local D1 for signed sessions, enrollment restrictions, and version-checked saves. Google authorization initiation and forged callback rejection pass; real Google exchange and deployed Worker CPU remain unverified. |
| D11 | Deployed for feasibility; decision pending | Prefer Cloudflare Free after CPU, quota, and Korea latency tests. A dedicated APAC-hinted D1/Worker test deployment now exists; Google callback verification is waiting for the user’s phone. Use the Raspberry Pi if free-tier compatibility fails; do not solve failure by purchasing a plan. |
| D12 | Proposed | Implement one production target first. Keep schema and domain code portable without building or operating two deployments at launch. |
| D13 | Confirmed | Invite-only pilot, then open registration. Public pages show the latest saved content with a clear editor sharing indicator. Support Korean and English. |
| D14 | Validated feasibility approach | A single recursive guarded UPDATE prevents hierarchy cycles under competing local D1 moves. This removes the need for a multi-request check-then-move sequence; full page-tree behavior remains M04. |

For future changes, record the trigger, alternatives, consequence, evidence, and issue/PR link. Preserve prior rationale when replacing a decision.
