# Authentication performance follow-up

Issue: [#11](https://github.com/injoonH/malino/issues/11), following the first hosted benchmark in [the feasibility report](feasibility.md). Updated 2026-11-18. Changes are deployed for measurement; Cloudflare Free suitability remains unresolved.

## Changes and rationale

- Reuse the Better Auth configuration object per D1 binding. Compare origin, auth secret, Google client credentials, and pilot allowlist before reuse. A changed binding or configuration constructs a fresh object. No user, cookie, session result, or request header is cached; every private request still verifies its session against D1.
- Enable Better Auth's joined lookup through `advanced.database.joins`, using the already-generated Drizzle relations. A warm session check now executes one SQL query instead of two. A fresh successful save uses two queries including authentication, instead of three. Session refresh and identical-save retries can add queries; they retain their existing semantics.
- Import `better-auth/minimal`, the documented adapter-only entry point. Drizzle handles persistence and migrations separately, so the direct-database/migration runtime is unnecessary. No dependency versions changed.
- Add request-scoped `Server-Timing` and database-call counts to the feasibility API. AsyncLocalStorage isolates overlapping requests; no SQL text, parameters, identities, content, cookies, or OAuth query strings are reported. These are wall-clock diagnostics, not CPU measurements. Database timing is nested inside auth/save timings: do not add them together. Worker timers may report zero for synchronous work between I/O; use Cloudflare CPU metrics for that work.
- Expand the operator check to five session lookups and five saves/renders for each of four fixtures: the original normal and near-limit documents, a 10,000-word Korean/English note, and a 100-row table plus header. Total: 45 requests per run and four synthetic documents. Separate phase windows by 1.1 seconds and retain individual timestamps, round trips, server timings, and query counts for CPU correlation. The first sample is retained separately in the ordered list, but is not guaranteed to be a cold isolate.

References: [Better Auth Drizzle joins](https://better-auth.com/docs/adapters/drizzle), [minimal import](https://better-auth.com/docs/guides/optimizing-for-performance). Cookie caching was considered and rejected because it would delay session revocation. Background rate-limit updates and handwritten authentication were not introduced.

## Local profile

The diagnostic runs the same real Better Auth code against disposable local D1 with a synthetic signed session. Node 24.22.1 on the Intel i5-1334U/WSL2 development environment; ten warm-up iterations and forty measured iterations per variant. Node process CPU includes application/adapter/client overhead and excludes the separate D1 emulator process. Results are indicative local measurements, not deployed Worker CPU or a controlled causal separation of every change.

| Variant | Session queries | Wall median / p95 | Node CPU median / p95 |
| --- | --- | --- | --- |
| Original, fresh auth per request | 2 | 26.01 / 38.68 ms | 17.60 / 35.90 ms |
| Original, manually reused auth | 2 | 19.82 / 49.47 ms | 10.31 / 33.81 ms |
| Joined/minimal, fresh auth | 1 | 14.59 / 33.94 ms | 12.03 / 31.99 ms |
| Joined/minimal, reused auth | 1 | 11.76 / 15.42 ms | 7.27 / 12.77 ms |

Raw reports: [baseline](measurements/2026-11-18-auth-baseline.json), [optimized](measurements/2026-11-18-auth-optimized.json). Rerun the current configuration with:

```sh
pnpm exec vitest run --config vitest.profile.config.ts
```

The script writes ignored `artifacts/auth-profile-optimized.json`. Reproducing the baseline requires the pre-change source; do not label current-source output as a baseline. This diagnostic is separate from ordinary CI tests and has no brittle latency threshold.

## Validation and deployment

- Type checking passes with zero errors/warnings; all 28 unit tests and 12 D1/auth integration tests pass.
- New integration coverage verifies request-metric isolation, changed secrets/origins, and a controlled database failure returning 503 without a false save acknowledgment. Existing immediate revocation, invite restriction, forged callback, owner isolation, retry/conflict, and hierarchy checks continue to pass. The session fixture also proves refresh can add a write without invalidating the one-query warm lookup result.
- Both updated operator browser checks pass: bounded requests with a redacted report, and stopping after a service error without retrying or claiming success. The previous five editor/browser baseline checks remain applicable; client editor code is unchanged.
- Minified Worker upload is 1,030.35 KiB / 266.72 KiB gzip, down from 1,266.81 / 321.03 KiB. Reported startup decreased from 91 to 49 ms; startup is not request CPU.
- Deployment version: `6cfeb20c-8963-45de-b109-2f8c6ba6e42a`, at https://malino-feasibility.yuwol036.workers.dev. The page exposes report version `auth-joins-v2`; health and signed-out access checks pass. Secrets, sessions, database schema, and plan settings were preserved.

## Remaining work

The user has been asked to refresh the test site and return the expanded JSON report from the same browser/account/network. Correlate its isolated phases with Cloudflare CPU aggregates, accounting for client clock alignment and telemetry delay. Do not claim deployed improvements or Free compatibility from the local profile.

OAuth initiation/callback CPU still needs separate attribution; the expanded authenticated run does not repeat Google login. Full D1 row accounting remains separate from database-call counts. Controlled 503 tests do not constitute completed application sync/backoff or full quota-exhaustion coverage. Real IME/mobile and remaining negative live auth checks are still open under #2.
