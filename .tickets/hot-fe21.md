---
id: hot-fe21
status: in_progress
deps: []
links: []
created: 2026-01-27T23:29:51Z
type: epic
priority: 0
assignee: cc-vps
---
# OSS + npm v0.1.0 release readiness


## Notes

**2026-07-17T01:58:08Z**

Starting follow-up release hardening: maintainer-only contribution policy, documented release workflow, tarball smoke test, CI build/package smoke coverage, and first-release changelog readiness.

**2026-07-17T02:05:53Z**

Implemented release hardening on chore/release-hardening: package-install smoke test is now part of verify/CI; release docs and prep/dry-run scripts added; release-it now requires a clean main checkout and pushes tags; initial changelog entries are under Unreleased; contribution policy now matches raindrop-cli and ticktick-cli. Validation: pnpm run verify passed.
