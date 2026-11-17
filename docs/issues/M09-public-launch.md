## Outcome

Open Google registration only after the pilot establishes acceptable reliability, usability, security, and capacity. Depends on M08.

## Acceptance criteria

- [ ] Review pilot findings and resolve blocking editor/data-loss/security issues.
- [ ] Calculate capacity from actual reads/writes, storage, auth, public traffic, and abuse headroom.
- [ ] Recheck provider pricing/limits and dependency security; keep Cloudflare strictly free if selected.
- [ ] Verify per-account quotas, enrollment throttling, public-link rate limits, signup kill switch, and failure communication.
- [ ] Confirm support/maintenance owner, incident and restore runbooks, privacy information, and deletion/export behavior.
- [ ] Record an explicit public launch decision and rollback criteria before changing enrollment policy.

If capacity is insufficient, keep the pilot limited or use the Pi according to the decision log. Do not silently purchase service capacity.
