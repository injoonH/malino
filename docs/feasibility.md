# M02 feasibility results

Measured 2026-11-16. **Local editor and database feasibility passed; hosted feasibility is still open.** The isolated test Worker is deployed; these results do not yet establish that the complete service fits Cloudflare Free.

## What is implemented

- A Svelte/Tiptap editor preview: visible formatting controls, headings, lists/tasks, quotes/code, simple tables with row/column controls, URL images, Markdown import/export, and Korean/English controls.
- Browser-only IndexedDB draft recovery, including continued editing during a connection failure. The UI explicitly says data is local. This is not the eventual authenticated synchronization queue.
- Lazy editor loading and separately loaded Markdown conversion. No font download, paid editor extension, collaboration runtime, or analytics is included in the app bundle.
- Performance samples: a 10,000-word English/Korean note, a 100-row table plus header, and 1,000 sidebar entries.
- An isolated Hono Worker with generated Better Auth/Drizzle schema, Google configuration, verified-email pilot enrollment restrictions, database sessions, atomic owner-scoped versioned saves, and a safe HTML rendering benchmark.
- A recursive single-statement hierarchy move tested on disposable local D1, including opposing concurrent moves and 20 levels of nesting. This is a feasibility proof, not the full page-tree API.

The editor preview and Worker are deliberately separate test surfaces. The hosted operator page starts Google login and offers bounded synthetic save/render measurements. A completed Google callback is still pending; public sharing and the synchronized note service are not implemented.

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

The D1 integration suite proves signed-cookie session verification, immediate revocation, allowlist hook rejection for uninvited/unverified users, Google authorization URL/state generation, rejection of forged callbacks, version conflicts, identical retries, cross-owner update rejection, body/origin checks, safe rendering headers, and atomic tree moves. Google itself is not contacted: the successful callback, token exchange, and identity verification still need a real end-to-end test.

## Remote deployment and pending checks

- Test origin: https://malino-feasibility.yuwol036.workers.dev, configured in `wrangler.remote.jsonc`. The local configuration remains isolated.
- Dedicated D1 database: `malino-feasibility`, created with the APAC location hint; migration applied successfully. APAC is not a guarantee of placement in Korea.
- Google credentials and pilot allowlist are configured as Worker secrets. The remote auth secret was generated independently of the local secret. Logs/observability storage and preview URLs are disabled.
- Remote health returns 200, signed-out session access returns 401, and Google authorization initiation returns the expected provider and exact HTTPS callback. The operator page sends no-store and noindex headers.
- The user reached Google's phone-verification prompt but cannot finish until their phone is available. This is not evidence of successful token exchange, account creation, or an authenticated save.
- The user's completed setup includes the requested Workers Free dashboard check. The CLI token's billing subscription read returns 403, so independent API billing verification is unavailable. No plan was changed.
- The operator check creates two synthetic documents, makes 20 save/render requests, and reports browser round-trip samples and note-SQL row counts only. It excludes auth SQL and does not measure Worker CPU.

Use [Cloudflare Worker metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/) for CPU evidence; startup duration and HTTP wall time are different measurements. Keep real note contents, callback query strings, and cookies out of diagnostics.

## Implementation decisions from the spike

1. Keep Svelte and Tiptap as the leading candidates: the measured shell/editor budgets pass without dropping tables. React or a different editor is not currently justified by the evidence.
2. Keep conversion off the typing path. Supported fixtures preserve structured content through Markdown export/import, including Korean text, lists/tasks, links/images, escaping, code, and basic tables. Raw HTML is rejected on Markdown import; merged table cells and unsupported structures are rejected rather than silently exported.
3. Pin TypeScript 6.0.3. The installed Svelte checker requires an extra compatibility setup for TypeScript 7; using the supported version avoids that unnecessary complexity. The abandoned deprecated Better Auth CLI was removed; schema generation uses `auth` 1.7.25.
4. Use atomic conditional SQL for saves. Identical retries return the existing revision without rewriting; changed retry payloads and stale writes fail. The owner/page composite key scopes every operation.
5. A single recursive guarded UPDATE is a viable D1 move strategy. The production implementation still needs ordering, depth limits, trash/restore, and full authorization tests.
6. Keep Cloudflare conditional. Successful local workerd/D1 tests and a small client bundle say nothing conclusive about the 10 ms deployed CPU budget, end-to-end latency, or account-wide quotas.

## Security and scope limitations

- The public renderer is an authenticated benchmark endpoint. It is not the final unlisted-share feature; no public share grants or token lifecycle exist yet.
- Google-only auth is configured with explicit origin/cookies, encrypted stored OAuth tokens, database rate limiting, and a closed enrollment allowlist. Real callback behavior and production proxy/origin settings remain release checks.
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

Follow [secure setup](feasibility-setup.md), then measure real Google login, session checks, normal and maximum-size saves, public rendering, D1 read/write amplification including auth, and Korea latency on an actual Free account. Test graceful quota failures with a bounded simulation rather than exhausting shared account quotas.

M02 remains open until those live checks and the manual IME/mobile checks pass. Track remaining work in [GitHub issue #2](https://github.com/injoonH/malino/issues/2).
