# malino — My Little Note

A fast, lightweight note app inspired by Notion, designed for people who do not need to know Markdown.

The first release focuses on a visual editor, nested pages, Google sign-in, and optional public read-only links. The initial audience is approximately ten people in Korea.

The repository contains the agreed product specification and a working feasibility prototype. The editor preview saves drafts in this browser only. A separate Worker test app validates Google auth configuration, signed sessions, D1 saves, and safe HTML rendering. These are not yet connected into a hosted note service.

The [hosted feasibility check](https://malino-feasibility.yuwol036.workers.dev) tests sign-in and synthetic saves for invited accounts. Track remaining live checks in [issue #2](https://github.com/injoonH/malino/issues/2).

## Run locally

Use Node.js 24 and pnpm 12.18.0:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the printed local URL. The preview includes visual formatting, checklists, tables, image URLs, Markdown import/export, Korean/English controls, and local draft recovery. Performance samples are available in the sidebar. Export notes you want to keep; browser storage can be cleared or evicted.

```sh
pnpm check
pnpm test
pnpm test:integration
pnpm build
pnpm measure:bundle
pnpm test:e2e
pnpm worker:check
```

Browser tests require Playwright Chromium and its OS libraries; see the [feasibility report](docs/feasibility.md) for this environment's test configuration. The integration suite creates a disposable local D1 instance and uses synthetic identities; it does not contact Google or deploy to Cloudflare. `worker:check` is a dry run.

## Project documents

- [Product specification](docs/product-spec.md): confirmed requirements, proposed defaults, and open questions.
- [Implementation plan](docs/implementation-plan.md): architecture, technology choices, alternatives, and delivery milestones.
- [Security and hosting](docs/security-and-hosting.md): threat model, deployment comparison, and free-tier limits.
- [Decision log](docs/decisions.md): rationale and current decision status.
- [Backlog](docs/backlog.md): resumable work items and GitHub publication status.
- [Feasibility results](docs/feasibility.md): measurements, validation, and remaining release gates.
- [Auth performance follow-up](docs/auth-performance.md): joined session lookups, local profiles, and pending deployed measurements.
- [Cloudflare and Google setup](docs/feasibility-setup.md): secure configuration for the live tests.

Research checked on 2026-11-16. Recheck dependency support and provider limits before implementation and deployment.
