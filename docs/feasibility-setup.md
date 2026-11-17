# Live feasibility setup

The local prototype and test harness are ready. Live testing needs a reachable Cloudflare account on **Workers Free** and a Google OAuth web client. Do not paste credentials into chat, issues, PRs, or command arguments.

Setup completed on 2026-11-16: Cloudflare login, local Google credentials, the pilot allowlist, and remote secrets are configured. The test Worker is live at https://malino-feasibility.yuwol036.workers.dev. The instructions below also serve as a fresh-environment reference; do not repeat resource creation or rotate secrets unnecessarily.

## 1. Prepare Cloudflare access

```sh
pnpm exec wrangler login
pnpm exec wrangler whoami
```

Check the intended account's Workers plan in the Cloudflare dashboard. Record that it is Free and note any other projects sharing its quotas. Do not change another application's paid account settings or assume a small workload guarantees no bill on a paid plan.

The checked-in `wrangler.jsonc` is intentionally local-only: its database ID is a placeholder, `workers_dev` is false, and no route is assigned. Leave it safe for local development.

The separate `wrangler.remote.jsonc` now records the actual account, dedicated `malino-feasibility` D1 database, and fixed HTTPS origin. The root sign-in page is publicly reachable; benchmark endpoints require an invited account. Configure only the required Workers/D1 resources. Do not enable paid plans/add-ons. Do not deploy the placeholder configuration as if it were a production app.

The dedicated database has already been created with an APAC location hint, and its migration has been applied. Run a remote migration only against the identified feasibility database. The integration tests always use disposable local D1 and must never be redirected to real user data.

## 2. Configure Google sign-in

In Google Cloud Console, create a project/client for malino (or use a deliberately chosen existing project). Configure Google Auth Platform branding/audience/data access and an OAuth client of type **Web application**. Keep the consent audience in testing for the pilot where applicable and add the intended test accounts.

Use this exact local redirect URI:

```text
http://localhost:8787/api/auth/callback/google
```

For the remote test, add this exact authorized redirect URI:

```text
https://malino-feasibility.yuwol036.workers.dev/api/auth/callback/google
```

 Use separate local and production clients/configuration when preparing the actual service. Do not add broad wildcard origins or request Drive/Gmail access. The configured scopes are `openid`, `email`, and `profile`.

References: [Better Auth Google setup](https://better-auth.com/docs/authentication/google), [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## 3. Configure local secrets

Copy `.dev.vars.example` to `.dev.vars`, then edit it locally:

- `BETTER_AUTH_SECRET`: an independently generated cryptographically random secret, at least 32 characters.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: values from the chosen Google OAuth web client.
- `PILOT_EMAILS`: comma-separated test-user Google email addresses. Empty means no new enrollment is allowed.

The file is ignored by Git. Keep real credentials out of the schema-generation helper, test fixtures, shell history, and screenshots. Production secrets belong in Wrangler/Cloudflare's secret store, entered interactively with `wrangler secret put` for the selected remote configuration.

```sh
pnpm db:migrate:local
pnpm worker:dev
```

The Worker provides `/health`, Better Auth routes under `/api/auth`, and authenticated benchmark endpoints under `/api/spike`. The Svelte editor preview remains browser-local; it is not wired to these endpoints yet.

## 4. Run the real auth and performance checks

1. Open https://malino-feasibility.yuwol036.workers.dev in your browser.
2. Select **Continue with Google** and complete Google's verification with the invited account. A different invited account completed this step on 2026-11-18; successful login is no longer blocked on phone availability.
3. After returning to malino, confirm that the page says sign-in succeeded.
4. Select **Run a small performance check**. It saves two synthetic documents and performs a bounded set of requests; no real notes are used.
5. Download the JSON results. These contain timing samples and SQL counts, not credentials or note contents. Record device/network context alongside the report.
6. Select **Sign out** and confirm that the sign-in button returns.

Never copy a session cookie or OAuth callback URL with query parameters into an issue or report. The Svelte editor remains a separate local preview.

Check both an invited account and an uninvited account. Verify logout/session revocation, a forged callback, and an untrusted origin. Do not treat the existing synthetic-session tests as evidence that Google token exchange has passed.

For deployed performance, use synthetic content only:

1. Measure login callback, session lookup, normal save, near-256-KiB save, and rendering CPU in Cloudflare's runtime metrics. Wall-clock HTTP timings are not CPU timings.
2. Record total D1 rows read/written, including auth, rate limiting, indexes, and retries. Save endpoint metadata reports its note SQL only and excludes the preceding session lookup.
3. Measure request latency from Korea, documenting connection/device, database placement, cold/warm behavior, sample count, and p50/p95. Include first editor readiness with real auth.
4. Exercise artificial 429/503/quota failures in a controlled test. Do not deliberately consume the real account's daily limits. Verify retry backoff, retained local content, and truthful save status in the eventual integrated UI.
5. Test Korean composition/paste on desktop and mobile, long notes, tables, and keyboard navigation manually. Synthetic text insertion is insufficient for this gate.

Proceed with Cloudflare only if CPU, latency, quota headroom, and account configuration meet the plan. If not, evaluate the Raspberry Pi path without enabling paid service capacity. Record the results and update D11 before beginning deployment-dependent foundation work.

## 5. GitHub workflow

All nine issues are published; see [the backlog](backlog.md). M01 is complete and M02 remains open. The user removed the signed-commit rule, and the initial main commit was created through the GitHub API because local Git metadata is read-only. Publish implementation changes on a feature branch with a PR; preserve the remaining main-branch protections. Inspect existing PRs before creating another one.
