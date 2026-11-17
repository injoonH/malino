# Product specification

Status: first-release product requirements confirmed; technical recommendations remain subject to feasibility testing. Updated 2026-11-16.

## Confirmed requirements

| Area | Requirement |
| --- | --- |
| Name | `malino`, meaning **My Little Note**. |
| Purpose | A very fast, lightweight, easy note app inspired by Notion. |
| Audience | Non-developers; no Markdown knowledge required. Approximately ten initial users, all in Korea. |
| Identity | Google sign-in; intended for an internet-facing service. Security must be considered before launch. |
| Privacy | Private notebooks, with optional public read-only links. |
| Sharing boundary | Only the selected page is shared. Children remain private. Public links are unlisted and excluded from search engines. |
| Editor | Visual editing with formatting buttons. Markdown shortcuts are optional. |
| Document storage | Structured editor data is the source of truth, with Markdown import/export. Export may normalize original Markdown syntax and spacing. |
| Organization | Multiple levels of nested pages. |
| Tables | Simple tables are required. Notion-style databases are unnecessary. |
| Images | Preview an image from a supplied URL. Image uploading is out of scope for now. |
| Collaboration | Simultaneous multi-user editing is unnecessary. |
| Connectivity | Online app that preserves unsent edits during connection failures. Full offline operation is not required. |
| Hosting | Compare reliability and maintenance. Raspberry Pi with Docker Compose is available; Cloudflare is allowed only with strictly free services. Other hosts may be considered. |
| Technology | No preferred programming language or framework. Explain the choices. |
| Registration | Invite-only pilot, then open registration after launch checks. |
| Public updates | Public links show the latest saved version, with a clear sharing indicator in the editor. |
| Languages | Korean and English interface. |
| Work tracking | Use GitHub issues and PRs heavily for resumability and handoff. Commits and tags are authorized. |

## Proposed first-release behavior

These are design recommendations, not additional confirmed requests.

- One personal workspace per account, a collapsible page tree, breadcrumbs, and title search. Multiple notebooks can be represented by top-level pages.
- Create, rename, reorder, move, trash, and restore pages. A menu-based move action is required; drag-and-drop can follow if it adds weight or accessibility problems.
- Editor: paragraphs, headings, bold, italic, strikethrough, links, bullet/numbered/task lists, quotes, code, separators, simple tables, and URL images. A visible toolbar and an Insert menu provide every essential operation. Slash commands are optional polish.
- Tables have a header and rectangular rows/cells with inline content. No merged cells, formulas, database properties, or arbitrary blocks inside cells.
- Define the supported Markdown subset and add a lossless structured export with page IDs and hierarchy. Raw HTML is not an execution feature. Storage and Markdown exchange semantics are confirmed above; exact schema and conversion coverage remain implementation choices.
- Save states distinguish “Saved on this device,” “Saving,” “Saved,” and “Could not sync.” Never label a note as saved to the server before acknowledgment.
- A disconnected open page remains editable. Recover unsent content after reload where browser storage remains available. No promise to open uncached pages or launch the app without a connection.
- If another tab/device has edited the same page, preserve both versions and offer a recovery copy. Never silently overwrite newer content.
- Responsive desktop and mobile layout, keyboard navigation, accessible labels/focus, and Korean IME testing.
- Manual export and tested backups; soft deletion with a proposed 30-day retention, counted against storage quotas.

## Sharing rules

- Generate a high-entropy unguessable URL. Possession of the URL grants read access: it is not suitable for secrets merely because it is unlisted.
- Share only the page body and title. Do not expose private ancestors, sibling titles, child-page titles, workspace identity, email, internal navigation, or private API data.
- Explicitly entered body text remains public. Before enabling sharing, show the exact public view and explain this boundary.
- Allow revocation and token rotation. Trashing a page or its ancestor makes the shared page unavailable. Restoring it does not automatically re-enable old links.
- Send `X-Robots-Tag: noindex, nofollow, noarchive` and matching page metadata. Do not publish a directory or sitemap of shared pages. Search-engine exclusion is a directive, not protection against people copying content or crawlers ignoring it.
- Serve public pages without shared caching in the first release so revocation and privacy changes take effect on subsequent requests. Previously downloaded copies cannot be recalled.
- Show a persistent “Shared publicly — saved edits are visible” indicator while editing a shared page. Only server-acknowledged content is public; unsent local drafts are not. Use the same atomic save/version boundary for private and public reads.

## Proposed measurable targets

These are acceptance budgets to validate, not measured claims.

| Metric | Initial target |
| --- | --- |
| Typing responsiveness | p95 input-to-paint under 50 ms on the agreed reference device. |
| Cached page switching | p95 under 100 ms with 1,000 page metadata entries. |
| Cold editor readiness | Under 2 seconds after an authenticated load on the documented Korea network profile, excluding Google login. |
| Browser JavaScript | At most 100 KiB gzip for the shell and 300 KiB gzip total to edit a basic page. Measure before finalizing editor dependencies. |
| Local draft persistence | Normally within 250 ms of a change; storage failures must be visible. |
| Remote saves | Debounce by about 1 second; no more than one save per 5 seconds per page while typing; flush on page navigation when possible. |

Fixtures: 1,000 pages, nesting to 20 levels, a 10,000-word note, a 100-row table, and Korean composition/paste. Test normal notes as well as limits. Define exact device, browser, CPU/network throttling, and sample counts in the editor spike. A proposed page payload ceiling is 256 KiB; do not silently truncate oversized content.

## Remaining alignment

The first-release product choices above, including structured storage with Markdown import/export, are confirmed. Initial quotas, performance budgets, exact document schema, and conversion coverage remain implementation proposals to validate. Hosting and framework choices remain recommendations until recorded as accepted.

Proposed language behavior: use browser language for the first visit, offer a visible language switch, and remember the choice per account. Interface language does not restrict note language.
