Published as [#11](https://github.com/injoonH/malino/issues/11).

## Problem

The first real Google-authenticated benchmark completed on 2026-11-18 08:29 KST, but CPU headroom does not yet support selecting Workers Free. During the 20-request save/render window, Cloudflare GraphQL reported CPU p50 7.103 ms, p95 11.294 ms, p99 15.497 ms and zero runtime errors. The broader 29-request window reached p99 40.615 ms; route attribution is unavailable, so this must not be labeled callback CPU.

The user's five samples per operation show normal saves at median 707 ms / max 748 ms and near-limit saves at median 1,096 ms / max 1,712 ms. Rendering medians are 504 ms and 545 ms. These are browser round trips, not CPU or typing latency. The device is an Intel Core i5-1334U with Firefox 160 on Windows; physical connection/VPN status remains unverified.

Parent: #2. Related implementation: #10. Preserve the successful baseline in `docs/measurements/`.

## Work and acceptance criteria

- [ ] Attribute request CPU separately to OAuth initiation/callback, session checks, ordinary saves, near-limit saves, and rendering; never log tokens, cookies, callback query strings, identity, or note contents.
- [ ] Profile repeated auth construction, database round trips, JSON validation and rendering before choosing optimizations. Preserve immediate session revocation, invite restrictions, owner isolation, CSRF checks, document limits, and atomic version checks.
- [ ] Repeat bounded cold/warm measurements with documented sample counts and realistic Korean/table documents; establish headroom below the Free CPU budget rather than relying on burst tolerance.
- [ ] Identify browser/network versus Worker/D1 contributions to save latency. Do not infer the Windows browser's route from an agent proxy's egress.
- [ ] Reconcile complete D1 analytics with note-SQL counts, including auth/rate-limit queries, sampling and reporting delay. The initial D1 aggregate was unreconciled (reported fewer writes than the browser's note-only counts); do not use it to project quotas.
- [ ] Validate controlled quota/service failures without exhausting account quotas.
- [ ] Update D11 and #2 with the hosting recommendation; evaluate the Pi if Free compatibility cannot be demonstrated. No paid plan, add-on, or reduced authorization checks.

Cloudflare documents that CPU quantiles can exceed limits without errors because of rollover CPU time: https://developers.cloudflare.com/workers/observability/metrics-and-analytics/ . A successful short run alone does not establish sustainable Free-tier compatibility.
