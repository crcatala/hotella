---
id: hot-oava
status: closed
deps: []
links: []
created: 2026-07-17T06:09:35Z
type: feature
priority: 2
assignee: cc-vps
---
# Add owner-triggered PR live-test workflow

Add a GitHub Actions workflow that runs Hotella live tests only when the repository owner comments /run-live-tests on a same-repository PR.

## Acceptance Criteria

Owner can comment /run-live-tests on a PR to run live tests against its head SHA; non-owners and fork PRs cannot trigger it; result is visible as a PR check and comment.


## Notes

**2026-07-17T06:09:38Z**

Started implementation: adding owner-only /run-live-tests GitHub Actions workflow modeled on raindrop-cli, adapted to pnpm/Node and Hotella live tests.

**2026-07-17T06:15:47Z**

Implemented and validated owner-only live-test workflow. It uses a least-privilege test job (contents read only, no persisted checkout credential) and a separate reporting job for the PR check/comment.
