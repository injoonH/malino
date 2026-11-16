# Security and hosting

This is a design threat review, not a completed implementation audit. Checked 2026-11-16; recheck before deployment.

## Hosting recommendation

For ten users in Korea, prefer **Cloudflare Free**, contingent on deployed measurements. It avoids maintaining a public origin and reduces dependence on home power, hardware, and internet. Edge delivery does not guarantee fast database access: measure the actual D1 placement and end-to-end Korea latency.

| Option | Reliability and maintenance | Decision |
| --- | --- | --- |
| Cloudflare Workers Static Assets + Workers Free + D1 | Managed edge delivery and TLS; no OS/container host to patch. Hard CPU, request, and storage limits can interrupt service. Account limits may be shared with other projects. | Preferred only if the measured workload fits strictly Free. |
| Raspberry Pi + Docker Compose + SQLite | Existing hardware, local control, and no serverless CPU deadline. Owner maintains OS, containers, TLS, disk, backups, power, and connectivity. Hardware/network details are currently unknown. | Fallback if Cloudflare fails the gate, or if direct data ownership outweighs maintenance. |
| Netlify Free | Managed deployment, a 300-credit monthly hard cap with no automatic recharge; deployment and usage share the budget. [Current plan](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/). | Viable, but offers no clear benefit for this small Workers/D1 design; validate database/runtime usage before adopting. |
| Vercel Hobby | Managed deployment with usage caps; exceeding many limits pauses the affected capability. Relational persistence needs a separately evaluated storage arrangement. [Current plan](https://vercel.com/docs/plans/hobby). | Viable, but this app gains little from a Vercel-specific framework or another database provider. Review current use terms if reconsidered. |

No availability SLA is promised for either proposed deployment. The Pi is not literally costless: electricity, storage replacement, and backup media still exist. Domain registration is separate from hosting; use an existing domain or supported provider hostname rather than purchasing one implicitly.

## Cloudflare Free constraints

| Resource | Published Free allowance |
| --- | --- |
| Worker requests | 100,000/day; 10 ms CPU per invocation. Network waiting is distinct from CPU time. |
| Static assets | Free/unlimited asset requests when served through the static-asset path; do not route all assets through application code. |
| D1 rows | 5 million read/day and 100,000 written/day. Scanned rows and index maintenance matter, not just API counts. |
| D1 storage | 500 MB per database, 5 GB/account, at most 10 databases on Free. One initial app database has the 500 MB ceiling. |
| D1 recovery | Seven days of Time Travel on Free. Separate exports are still required. |

Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

On Free, exhausted D1 daily quotas cause query errors; they do not grant unlimited operation. Storage exhaustion blocks further growth. The operating goal is no billing, with graceful degradation when limits are reached.

Controls:

- Verify the actual account uses Workers Free before deploying; an existing paid account must not be treated as safe merely because usage looks small. Do not downgrade unrelated resources. Select an eligible Free account or use the Pi.
- Enable only static assets, Workers Free, and D1 needed by the app. No paid Workers plan, image transformation service, paid storage add-on, or other billable feature.
- Run authentication and maximum-size save/public-render benchmarks on deployed Workers. Heavy auth/validation can exceed 10 ms; moving to Paid is not an allowed remedy.
- Proposed pilot caps: 1,000 pages and 20 MiB of serialized note content per user, with deleted content included; 256 KiB per page. Measure metadata/index/auth overhead separately. Stop new enrollment well before database capacity; monitor actual database size and reserve headroom for auth and recovery.
- Debounce and cap save frequency. Illustrative load only: 10 users × 30 active minutes/day × 12 saves/minute = 3,600 saves/day. At an assumed five row/index writes per save this is 18,000 writes, before auth, sharing, structural changes, and abuse. Replace that assumption with measured D1 metadata; do not infer a supported-user guarantee from this example.
- Index authorization and lookup predicates; bound list sizes, exports, payloads, and expensive tree operations. Avoid per-keystroke requests and constant polling.
- Track quotas/capacity, keep the pilot closed, provide an operator signup kill switch, and stop retry storms on quota errors. UI keeps drafts locally when synchronization is unavailable.
- Read-only mode may reduce writes but cannot guarantee reads when read/request quotas are exhausted. Communicate degraded availability honestly.
- Deployment uses local builds/manual deployment initially; review any CI/build service quota before enabling it. Billing alerts are not a hard spending cap.

## Raspberry Pi fallback

Before choosing this path, record Pi model, architecture/OS, RAM, SSD versus SD storage, existing workloads, internet ingress, backup destination, and domain/TLS arrangement.

Use an ARM-compatible production Node.js image serving the static UI and Hono API, a persistent SQLite volume in WAL mode, and a TLS reverse proxy such as Caddy. Docker Compose defines health checks, restart policy, resource limits, and secrets supplied outside Git. Prefer a non-root process and SSD storage. Do not expose SQLite or management ports to the internet.

Use SQLite's supported online backup mechanism or a coordinated snapshot, not an arbitrary copy of a live main database file that ignores WAL state. Store encrypted backups off-device and test restore. Do not automatically replicate production between Pi and Cloudflare; migration is a deliberate export/import and cutover with write suspension and validation.

## Threat model and required controls

| Threat | Control and evidence required |
| --- | --- |
| One account accesses another's notes | Derive owner from the server session. Owner-scoped SQL and same-owner parent constraints for every private route, search, move, export, trash, and share operation. Test with two users and guessed IDs. |
| Google login spoofing or callback attacks | Maintained OAuth/OIDC library; exact redirect/origin allowlists; validate state, PKCE where supported, and nonce where used. Verify ID-token signatures and issuer/audience/expiry through the library. Use Google subject/provider identity as the stable key. Test callback tampering and replay. |
| Pilot enrollment bypass | Check an operator-controlled allowlist against a verified Google identity before provisioning a new user. No client-submitted approval flag. Existing approved users stay bound to stable account identity. |
| Stolen sessions/CSRF | HTTPS; HttpOnly, Secure, SameSite cookies; explicit session expiry/revocation. Apply origin/CSRF protection to our mutation endpoints as well as auth routes. SameSite alone is insufficient. No bearer tokens in localStorage. |
| Unneeded Google access | Request only sign-in scopes (`openid`, `email`, and `profile` if used). No Drive/Gmail scope, offline access, or refresh token unless a later feature requires it. Avoid storing provider access tokens where configuration permits; protect any required token storage. |
| Stored XSS through notes or pasted HTML | Validate document node/mark schema and sizes; sanitize pasted/imported content; safe renderers and URL schemes; no executable raw HTML. Test malicious links, images, markup, and public rendering. Set a restrictive CSP and anti-framing policy. |
| Public link leaks private structure | Separate minimal public response DTO/renderer. Read only active token-bound page content; no descendants, ancestor breadcrumbs, owner profile, private navigation, or hidden editor JSON payload. Strip private page-reference metadata while retaining text the author explicitly wrote. |
| Revoked/trash links still readable | Hash share tokens at rest; check active share and page/subtree availability on each request; no shared content caching. Revoke on trash; restore never revives a grant. Avoid token-bearing request paths in application/analytics logs where configurable. |
| Image URL SSRF or tracking | Render remote images in the browser via HTTPS image elements, never server-fetch arbitrary image URLs. Disallow dangerous schemes and raw embedded HTML/SVG documents. Use no-referrer, lazy loading, safe links, and broken-image fallback. Third-party image servers can still observe viewer requests/IP; disclose that behavior and provide a way to disable loading external images. Do not claim URL validation eliminates browser-side network risks. |
| Flooding/exhaustion | Rate-limit auth, public reads, writes, imports, and sharing; size/page/account quotas and pagination. Use a limiter appropriate to the selected deployment; per-process memory alone is not a distributed guarantee. Validate trusted proxy headers. |
| Lost edits | Durable local queue, atomic version-checked writes, retry IDs, explicit conflict recovery, and tested backups. Browser storage is not a backup and can be cleared or evicted. |
| Data leak through logs/backups | Redact cookies/tokens/query secrets and avoid note bodies in logs. Restrict backup access, encrypt off-host copies, set retention and document deletion behavior. Avoid third-party analytics on notes/public links initially. |
| Vulnerable dependencies/configuration | Lock dependencies, review license/security updates, secret scanning, least-privilege deployment credentials, and tested migrations. Audit the implementation before opening registration. |

Authentication references: [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect), [Better Auth Google setup](https://better-auth.com/docs/authentication/google), [Better Auth security](https://better-auth.com/docs/reference/security). These guide implementation; installing an auth library is not proof that the app is secure.

For Workers specifically, check Node compatibility, binding/secret configuration, and trusted client-IP headers against the [Better Auth Cloudflare guide](https://better-auth.com/docs/guides/cloudflare). Do not use Workers KV as Better Auth secondary storage: the guide identifies incompatible atomicity/consistency requirements. Prefer the database initially and measure its auth/rate-limit write cost.

## Launch and recovery requirements

- Separate Google OAuth clients/configuration for local development and production; fixed HTTPS callbacks, configured consent screen, public support/privacy information, and any Google-required verification completed before broad registration. Never put client secrets in browser bundles.
- Proposed daily encrypted off-provider backups with 7 daily and 4 weekly copies, subject to available backup storage. Rehearse a restore and set an initial 24-hour backup recovery-point objective. D1 Time Travel supplements exports. Logical corruption and account compromise must not destroy all recovery copies.
- Provide account data export/deletion, and explain backup expiry. Initial proposal: permanent deletion removes active data immediately and ages out of backups within 35 days; any restore must reapply deletion records before serving users.
- Establish a contact and a brief incident procedure: disable new registration/sharing if necessary, revoke sessions/tokens, restore safely, and communicate affected data. No note contents in incident issues.
- Before public registration, review pilot performance, actual quota consumption, security tests, restore evidence, privacy copy, and maintenance ownership. No paid service activation is implied by launch.
