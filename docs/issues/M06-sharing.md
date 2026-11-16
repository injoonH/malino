## Outcome

Users can share exactly one page through an unlisted read-only link that reflects its latest server-saved version. Depends on M04 and M05.

## Acceptance criteria

- [ ] Explicit share action and public-view preview; persistent indicator that saved edits are public.
- [ ] Cryptographically random token, hashed storage, revocation, and rotation.
- [ ] Public renderer exposes only the chosen page's public title/body; children and private metadata remain private.
- [ ] Link is read-only, has no editor bundle, is absent from sitemap/listings, and returns robots exclusion headers/metadata.
- [ ] No shared content caching; trash/revoke take effect on the next request. Restore does not reactivate links.
- [ ] Sanitization, safe URLs, external-image privacy controls, rate limits, and token-log handling tested.
- [ ] Tests cover unauthenticated reads, guesses, revocation, nested pages, deleted ancestors, and private-link leakage.

Explain that unlisted links and search-engine directives do not prevent copying or access by someone holding the URL.
