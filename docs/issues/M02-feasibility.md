## Outcome

Prove that the editor and strictly free hosting can meet malino's goals before building the full app. Depends on [M01 / #1](https://github.com/injoonH/malino/issues/1). Published as [#2](https://github.com/injoonH/malino/issues/2).

## Work

Create a minimal Svelte/Tiptap editor with required blocks, tables, URL images, and Markdown round-trip fixtures. Measure real production bundle output, Korean IME behavior, mobile input, typing latency, large-tree/page behavior, and editor startup. Validate Better Auth Google callback/session, maximum-size versioned saves, public rendering, and atomic hierarchy operations on deployed Workers Free/D1. Measure Korea latency and D1 row amplification.

## Acceptance criteria

- [ ] Document device/browser/network, fixtures, methodology, actual results, licenses, and compatible dependency versions.
- [ ] Required Markdown subset survives round trips; unsupported syntax has explicit behavior.
- [ ] CPU headroom is measured on deployed Workers; free-tier exhaustion behavior is tested safely.
- [ ] Confirm database placement/latency, bounded queries, transaction strategy, and actual account eligibility for Free.
- [ ] Select Cloudflare or Pi based on evidence; record alternatives if the editor or auth library fails. No paid upgrade.

No real user notes or production credentials in fixtures or issues. A successful local emulator test alone does not satisfy this issue.

## Progress: 2026-11-18

Local implementation and measurements are complete; this issue remains open for the live gates. See `docs/feasibility.md` and `docs/feasibility-setup.md`.

- [x] Svelte/Tiptap prototype with formatting, tables, URL images, optional Markdown shortcuts, import/export, and browser draft recovery.
- [x] Supported round-trip fixtures, unsafe-content tests, production bundle measurement, and headless browser timing proxies.
- [x] Local D1 migrations, signed Better Auth sessions, allowlist hook, Google authorization initiation, forged callback rejection, version conflicts, retries, and racing tree moves.
- [x] Korean/English labels, narrow viewport check, and screenshots. Real Korean IME and physical mobile testing remain manual gates.
- [x] Worker dry run and dedicated remote Worker/D1 deployment; health and signed-out access checks pass.
- [x] Cloudflare access and Google credentials configured securely; user completed the requested Free-plan check. API billing reads are unavailable to the CLI token.
- [x] Real Google login and 20 authenticated save/render requests completed; user report preserved in `docs/measurements/2026-11-18-browser.json`.
- [ ] Resolve CPU headroom (benchmark p95 11.294 ms versus 10 ms Free budget), total D1 row accounting, bounded quota-failure behavior, and latency attribution in [#11](https://github.com/injoonH/malino/issues/11).
- [ ] Final hosting decision based on live evidence.

Normal save median/max was 707/748 ms; near-limit save median/max was 1,096/1,712 ms. Five samples per case are insufficient to establish production p95. The successful login gate is complete; the overall feasibility gate remains open. The test site is https://malino-feasibility.yuwol036.workers.dev. `docs/feasibility-pr.md` contains the PR description.
