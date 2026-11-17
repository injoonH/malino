# M02 feasibility results

Local baseline measured 2026-11-16; live results added 2026-11-18. **Local editor and database feasibility passed; hosted feasibility is still open.** The isolated test Worker is deployed; these results do not yet establish that the complete service fits Cloudflare Free.

## What is implemented

- A Svelte/Tiptap editor preview: visible formatting controls, headings, lists/tasks, quotes/code, simple tables with row/column controls, URL images, Markdown import/export, and Korean/English controls.
- Browser-only IndexedDB draft recovery, including continued editing during a connection failure. The UI explicitly says data is local. This is not the eventual authenticated synchronization queue.
- Lazy editor loading and separately loaded Markdown conversion. No font download, paid editor extension, collaboration runtime, or analytics is included in the app bundle.
- Performance samples: a 10,000-word English/Korean note, a 100-row table plus header, and 1,000 sidebar entries.
- An isolated Hono Worker with generated Better Auth/Drizzle schema, Google configuration, verified-email pilot enrollment restrictions, database sessions, atomic owner-scoped versioned saves, and a safe HTML rendering benchmark.
- A recursive single-statement hierarchy move tested on disposable local D1, including opposing concurrent moves and 20 levels of nesting. This is a feasibility proof, not the full page-tree API.

The editor preview and Worker are deliberately separate test surfaces. The hosted operator page starts Google login and offers bounded synthetic save/render measurements. A real Google login and authenticated benchmark have succeeded; public sharing and the synchronized note service are not implemented.

## Measurements

Production client build, Node 24.22.1, pnpm 12.18.0, Svelte 5.57.3, Tiptap 3.34.0, Vite 8.3.8. Exact versions and transitive resolutions are pinned in the manifest/lockfile.

| Measurement | Result | Interpretation |
| --- | --- | --- |
| Shell JavaScript, gzip | 19,211 bytes / 18.8 KiB | Under proposed 100 KiB budget. |
| Total JavaScript to edit, gzip | 160,985 bytes / 157.2 KiB | Includes shell and editor; under proposed 300 KiB budget. |
| Total after loading Markdown conversion, gzip | 180,026 bytes / 175.8 KiB | Conversion is loaded only for import/export. |
| CSS, gzip | 2,110 bytes / 2.1 KiB | Separate from JS totals. |
| Fresh-context editor-ready p95 | 179.4 ms, 5 samples | Unthrottled loopback preview, without authentication. |
| Input to second animation frame p95 | 32.4 ms, 60 samples | Paint-opportunity proxy on the 10,000-word note. |
| Page switch p95 | 29.6 ms, 20 samples | Two repeatedly opened pages with 1,000 sidebar rows. |
| Minified remote Worker upload | 1,266.81 KiB uncompressed / 321.03 KiB gzip | Server bundle only; never downloaded by the editor. Reported startup was 91 ms, which is not per-request CPU. |

Client gzip measurements sum compressed resource files using Node's default gzip settings and the Vite dependency manifest. They may differ slightly from Vite's displayed compression estimate. They are transfer-size estimates, not browser heap measurements.

Browser environment: Chromium 156.0.8078.4, Linux/WSL2 6.18.58.1, Intel Core i5-1334U; 1440×1000 desktop viewport and a separate 390×844 layout check. CPU and network are unthrottled. Each readiness sample uses a fresh browser context. Typing uses Playwright text insertion followed by two animation frames; it is not a real Korean input-method session or a field INP measurement. Page switching is timed from the in-page click to readiness and a following animation frame.

Raw reports and screenshots are regenerated under ignored `artifacts/`: `bundle.json`, `browser.json`, `editor-desktop.png`, `editor-table.png`, and `editor-mobile-ko.png`. The numbers above preserve the measured baseline in Git even though generated artifacts are ignored.

## Validation

| Check | Result |
| --- | --- |
| `pnpm check` | Zero errors and warnings. |
| `pnpm test` | 28 tests pass: Markdown round trips, unsafe-content rejection, real SQLite save/conflict/retry behavior, owner isolation, indexed lookup, and safe HTML rendering. |
| `pnpm test:integration` | Nine tests pass against disposable local D1 and real Better Auth code. |
| `pnpm test:e2e` | Seven Chromium checks pass: formatting/draft reload, table/export, Korean/narrow layout, disconnected editing recovery, and performance samples/screenshots, bounded operator reports, and operator service failures. |
| `pnpm build` and `pnpm measure:bundle` | Pass, including both bundle budgets. |
| `pnpm db:migrate:local` | Initial local D1 migration succeeds. |
| `pnpm worker:check` | Worker dry run and separate remote deployment succeed. |
| `pnpm audit --prod` | Pass: zero reported production dependency vulnerabilities on 2026-11-16. This does not replace security review. |

The D1 integration suite proves signed-cookie session verification, immediate revocation, allowlist hook rejection for uninvited/unverified users, Google authorization URL/state generation, rejection of forged callbacks, version conflicts, identical retries, cross-owner update rejection, body/origin checks, safe rendering headers, and atomic tree moves. Google itself is not contacted by the automated suite. The user completed a real Google login and authenticated benchmark on 2026-11-18; logout and uninvited-account live checks remain.

## Remote deployment and pending checks

- Test origin: https://malino-feasibility.yuwol036.workers.dev, configured in `wrangler.remote.jsonc`. The local configuration remains isolated.
- Dedicated D1 database: `malino-feasibility`, created with the APAC location hint; migration applied successfully. APAC is not a guarantee of placement in Korea.
- Google credentials and pilot allowlist are configured as Worker secrets. The remote auth secret was generated independently of the local secret. Logs/observability storage and preview URLs are disabled.
- Remote health returns 200, signed-out session access returns 401, and Google authorization initiation returns the expected provider and exact HTTPS callback. The operator page sends no-store and noindex headers.
- The user completed Google sign-in with an invited test account and supplied a successful authenticated benchmark on 2026-11-18; see the recorded results below.
- The user's completed setup includes the requested Workers Free dashboard check. The CLI token's billing subscription read returns 403, so independent API billing verification is unavailable. No plan was changed.
- The operator check creates two synthetic documents, makes 20 save/render requests, and reports browser round-trip samples and note-SQL row counts only. It excludes auth SQL and does not measure Worker CPU.

Use [Cloudflare Worker metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/) for CPU evidence; startup duration and HTTP wall time are different measurements. Keep real note contents, callback query strings, and cookies out of diagnostics.

## First authenticated remote test — 2026-11-18

The user supplied a completed browser report at 08:29:31 KST (2026-11-17 23:29:31 UTC). Real Google login, the authenticated session, ten versioned saves, and ten render requests succeeded. This clears the successful-login gate, not the complete security or hosting gates. Raw measurements: [browser report](measurements/2026-11-18-browser.json), [Cloudflare aggregates](measurements/2026-11-18-cloudflare.json).

| Operation | Payload | Median round trip | Reported p95 / maximum | Samples |
| --- | --- | --- | --- | --- |
| Normal save | 3,385 bytes | 707 ms | 748 ms | 5 |
| Normal render | 3,385 bytes | 504 ms | 532 ms | 5 |
| Near-limit save | 261,205 bytes | 1,096 ms | 1,712 ms | 5 |
| Near-limit render | 261,205 bytes | 545 ms | 576 ms | 5 |

The browser computes the nearest-rank p95; with five samples it equals the maximum. This is a small functional benchmark, not a reliable production tail-latency estimate. Rendering includes authentication and HTML download, but does not measure browser paint or a public sharing route. Typing responsiveness is not measured by these timings.

Environment: the user confirmed this development PC; `/proc/cpuinfo` identifies an Intel Core i5-1334U. The report identifies Firefox 160 on Windows (the user agent does not establish the exact Windows edition). WSL2 exposes approximately 15.3 GiB RAM, which is not proof of total physical host memory. Agent egress reports country KR and Cloudflare edge LAX; the agent may use a different proxy/route from Windows Firefox. Windows adapter inspection failed through WSL interop. Physical connection type, browser VPN/proxy use, and browser route remain unverified. No IP address is retained.

Cloudflare GraphQL for the matching 23:29:31–23:29:48 UTC window reports 20 requests, zero runtime errors, CPU p50 **7.103 ms**, p95 **11.294 ms**, and p99 **15.497 ms**. Worker wall-time p50/p95 are 358.642/944.192 ms. The API schema explicitly defines CPU and wall-time quantiles in microseconds; the figures here are converted to milliseconds. These are aggregate quantiles, not per-route measurements, and subtracting unrelated quantiles would not isolate network delay.

The broader 23:25–23:30 UTC window reports 29 requests, zero runtime errors, and CPU p95/p99 25.115/40.615 ms. That window includes other requests around sign-in; there is no evidence assigning the peak to a particular auth endpoint. Runtime success is also distinct from an HTTP success status.

Each five-save case reports 18 rows read and six written for note SQL: initial create 2/2, then four updates at 4/1. The combined note-only totals are 36 reads and 12 writes, excluding authentication. Preliminary D1 analytics report APAC, 45 reads and nine writes for the benchmark window, which does not reconcile with the note-only writes. Reporting delay, sampling, and window alignment need investigation before using these aggregates for quota projections.

**Hosting decision remains open.** The measured CPU tail exceeds the published 10 ms Free budget, so adequate headroom has not been demonstrated. Cloudflare documents rollover CPU tolerance that can allow over-limit quantiles without errors; a successful short run does not prove sustainable compatibility. See [metrics behavior](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/) and [runtime limits](https://developers.cloudflare.com/workers/platform/limits/). No paid resources or plan changes were introduced.

Next: [issue #11](https://github.com/injoonH/malino/issues/11) covers route-specific CPU profiling, database round trips, realistic cold/warm fixtures, latency attribution, total D1 accounting, and controlled quota failures. Preserve all authorization and recovery protections during optimization. Evaluate the Pi if Free headroom cannot be established.

## Implementation decisions from the spike

1. Keep Svelte and Tiptap as the leading candidates: the measured shell/editor budgets pass without dropping tables. React or a different editor is not currently justified by the evidence.
2. Keep conversion off the typing path. Supported fixtures preserve structured content through Markdown export/import, including Korean text, lists/tasks, links/images, escaping, code, and basic tables. Raw HTML is rejected on Markdown import; merged table cells and unsupported structures are rejected rather than silently exported.
3. Pin TypeScript 6.0.3. The installed Svelte checker requires an extra compatibility setup for TypeScript 7; using the supported version avoids that unnecessary complexity. The abandoned deprecated Better Auth CLI was removed; schema generation uses `auth` 1.7.25.
4. Use atomic conditional SQL for saves. Identical retries return the existing revision without rewriting; changed retry payloads and stale writes fail. The owner/page composite key scopes every operation.
5. A single recursive guarded UPDATE is a viable D1 move strategy. The production implementation still needs ordering, depth limits, trash/restore, and full authorization tests.
6. Keep Cloudflare conditional. The first live run succeeds functionally but exceeds the 10 ms CPU budget in its tail; adequate headroom and account-wide quota usage remain unproven.

## Security and scope limitations

- The public renderer is an authenticated benchmark endpoint. It is not the final unlisted-share feature; no public share grants or token lifecycle exist yet.
- Google-only auth is configured with explicit origin/cookies, encrypted stored OAuth tokens, database rate limiting, and a closed enrollment allowlist. The successful live login is recorded below; negative auth checks, logout, and final production proxy/origin settings remain release checks.
- Client image validation covers URL entry, imported content, and rendering. Images still contact third-party hosts; the full user preference for disabling external images is deferred to the product implementation.
- The Worker validates document schema/structure and escapes rendered content. This does not constitute an independent security review. Keep dependency auditing in the release checks.
- Browser drafts are only for this local preview. Account-scoped sync, durable multi-device conflict recovery, storage quotas, export recovery for every failure, and production data deletion remain later issues.
- The suite inserts Korean text and checks Korean UI/layout; real Korean IME composition, physical mobile browsers, screen-reader behavior, and constrained devices still need testing.

## Reproduction and environment notes

Run the commands in the root README. `test:e2e` uses a production preview, so run `pnpm build` first. An existing preview may be reused locally; CI starts its own server.

This host had Chromium revision 1248 installed, while the Playwright package expects revision 1255. Tests used the existing Chromium executable via `MALINO_CHROMIUM_PATH`; the recorded browser version above reflects the actual executable. On a normal development machine, install the matching browser with `pnpm exec playwright install chromium` and omit that override.

The host also lacked discoverable NSS/ALSA libraries and Korean fonts. QA used existing Firefox NSS libraries, an existing local ALSA library exposed under `/tmp/malino-browser-libs`, and a temporary fontconfig file pointing to the host's Windows fonts. No system packages, fonts, or browser binaries were modified or bundled into malino. For this session only, the browser command was:

```sh
pnpm exec env \
  MALINO_CHROMIUM_PATH=/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome \
  LD_LIBRARY_PATH=/home/user/.cache/ms-playwright/firefox-1572/firefox:/tmp/malino-browser-libs \
  FONTCONFIG_FILE=/tmp/malino-fonts.conf \
  playwright test
```

These temporary paths are machine-specific and are not required by the application. The ordinary app uses system fonts, including Korean system font fallbacks. If the temporary files are removed, install normal browser OS dependencies or recreate the QA-only setup before rerunning on this host.

## Remaining gates

The successful login and synthetic save/render checks are recorded above. Follow [issue #11](https://github.com/injoonH/malino/issues/11) to resolve CPU headroom, full D1 accounting, and latency attribution. Complete live logout/uninvited-account checks, realistic maximum-size documents, and final public-render testing. Test graceful quota failures with a bounded simulation rather than exhausting shared account quotas.

M02 remains open until those live checks and the manual IME/mobile checks pass. Track remaining work in [GitHub issue #2](https://github.com/injoonH/malino/issues/2).
