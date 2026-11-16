# Working on malino

Read README.md, docs/product-spec.md, docs/decisions.md, and docs/backlog.md before changing the project. Read the implementation and security plans for relevant work.

- Preserve the distinction between confirmed user requirements and proposed implementation choices. Record user answers and changes in the specification and decision log.
- Prioritize fast typing, reliable saves, a small client bundle, and usability without Markdown knowledge.
- Google authentication does not replace authorization. Scope every private operation to the authenticated owner; explicitly isolate public read-only access.
- No simultaneous collaboration, Notion-style databases, or image uploads in the initial scope. Simple tables and image URL previews are required.
- Cloudflare deployment must use strictly free services. Do not enable paid plans, overages, or paid add-ons to solve implementation problems.
- The user authorizes GitHub issues, PRs, commits, and tags. Use issues with acceptance criteria and focused PRs; update the backlog with links, results, and next steps. When GitHub is unavailable, preserve issue and PR drafts locally and clearly record what was not published.
- Never include secrets, note contents, OAuth tokens, or live sharing tokens in issues, PRs, logs, or fixtures.
- Run checks appropriate to the change. Security, save-conflict, hierarchy, and Markdown conversion tests are release requirements. Performance claims require measurements on documented fixtures and devices.
- Do not infer that proposals in the plan are already implemented or approved. No sub-agent work is requested by these instructions.
