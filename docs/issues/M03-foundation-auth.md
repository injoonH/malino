## Outcome

An invited Google user can securely enter a Korean/English app shell. Depends on M02.

## Acceptance criteria

- [ ] Strict TypeScript setup, pinned packages/lockfile, migrations, and CI checks.
- [ ] Language strings separated from UI; browser default, visible switch, and remembered preference.
- [ ] Google-only login, server-managed secure sessions, logout/revocation, and fixed trusted origins/callbacks.
- [ ] Verified-identity pilot allowlist enforced before provisioning; negative enrollment tests.
- [ ] Owner identity derived from session; no secrets/provider tokens bundled into the browser.
- [ ] Runtime validation, CSRF/origin protection, redacted logs, security headers, and deployment-appropriate rate limiting.
- [ ] Test forged/expired sessions, callback tampering, untrusted origins, and invitation bypass.

Use `docs/security-and-hosting.md` as the threat checklist. Validate the library's generated schema and runtime behavior rather than assuming defaults cover custom API routes.
