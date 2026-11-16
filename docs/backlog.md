# Backlog and handoff

Updated 2026-11-16. Repository remote: `https://github.com/injoonH/malino.git`.

## Current state

- Requirements and all product clarification answers are captured in [the specification](product-spec.md) and [decision log](decisions.md). M01 is complete.
- M02 has a working local editor and a deployed, invite-restricted Worker test app at https://malino-feasibility.yuwol036.workers.dev. See [results](feasibility.md) and [live setup](feasibility-setup.md). The editor remains separate from the backend.
- The user completed local credentials/account setup and confirmed the requested Workers Free check. The CLI can deploy, but its token cannot independently read billing subscriptions. No paid plan or add-on was enabled.
- Google authorization reaches the phone-verification step. The user does not currently have their phone; real callback/exchange, authenticated remote measurements, and final hosting selection remain pending.
- All nine GitHub issues are published. M01 is closed; M02–M09 remain open.
- [Draft PR #10](https://github.com/injoonH/malino/pull/10) contains the planning documents and feasibility implementation on `feat/feasibility`. It is not merged.
- Local Git metadata is read-only. After the user removed the remote signed-commit requirement, a minimal main branch was initialized through the GitHub API. Implementation publication uses a feature branch and PR; remaining branch protections are preserved.

## Published issues

Local issue files preserve editable issue bodies. Do not create duplicates.

| Local ID | GitHub issue | Depends on | Status |
| --- | --- | --- | --- |
| M01 | [#1 — Product alignment](https://github.com/injoonH/malino/issues/1) | — | Complete |
| M02 | [#2 — Editor and Cloudflare Free feasibility](https://github.com/injoonH/malino/issues/2) | M01 | Live gates pending |
| M03 | [#3 — Bilingual foundation and Google access](https://github.com/injoonH/malino/issues/3) | M02 | Planned |
| M04 | [#4 — Nested pages and trash](https://github.com/injoonH/malino/issues/4) | M03 | Planned |
| M05 | [#5 — Editor, autosave, and recovery](https://github.com/injoonH/malino/issues/5) | M02–M04 | Planned |
| M06 | [#6 — Public read-only sharing](https://github.com/injoonH/malino/issues/6) | M04, M05 | Planned |
| M07 | [#7 — Exports and recovery](https://github.com/injoonH/malino/issues/7) | M04, M05 | Planned |
| M08 | [#8 — Pilot deployment and release checks](https://github.com/injoonH/malino/issues/8) | M03–M07 | Planned |
| M09 | [#9 — Public registration](https://github.com/injoonH/malino/issues/9) | M08 | Planned |

Use one or more focused PRs per issue rather than accumulating the entire app in one branch. Every implementation PR describes behavior, validation results, and any remaining risk. Link the issue using `Closes #N` only when its acceptance criteria are met. Do not assign people or send separate messages without authorization.

## Next session

1. Read the specification, decision log, and [feasibility report](feasibility.md). Preserve the local prototype and existing dedicated remote resources.
2. Inspect the remote branches and PRs before publishing changes. The workspace Git metadata may still lack the API-created main commit; do not overwrite local files or force-push.
3. When the user's phone is available, finish Google sign-in at the test site and run its bounded synthetic performance check. Follow [setup instructions](feasibility-setup.md). No credential or cookie should be pasted into chat.
4. Measure deployed request CPU, total D1 row usage, and Korea latency; exercise bounded simulated quota failures and manual Korean IME/mobile checks. Keep M02 open until the hosting decision is supported by evidence.
5. Continue M03 after the feasibility gates. Do not rebuild the editor prototype from scratch.

## Verification

Type checking, 28 unit/SQLite tests, nine local D1/auth integration tests, seven browser checks (44 automated tests total), production bundle measurements, and Worker builds pass. The production dependency audit reports zero known vulnerabilities. Full methodology, limitations, and current results are in the feasibility report.
