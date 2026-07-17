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

**2026-07-17T03:59:09Z**

Addressed PR #23 review findings: added a clean-before-build workflow to prevent stale dist artifacts, serialized package smoke verification after test/build writers, and added a release:first command/docs for the initial v0.1.0 publish.
**2026-07-17T11:28:48Z**

Improving release:prep with strict clean-tree detection, optional base revision, empty-range messaging, change summary, and a copyable changelog AI prompt.

**2026-07-17T11:29:35Z**

Updated scripts/prep-release.sh: strict porcelain clean check (including untracked files), optional validated base ref, explicit empty-range output, diff stat, and copyable Keep a Changelog AI prompt. Validated syntax and clean/invalid-ref/untracked scenarios in a temporary git repository.

**2026-07-17T11:38:50Z**

OSS audit remediation started: update vulnerable runtime dependency, document Google scraping/privacy boundaries, pin airport data source, harden CI token permissions, refresh release docs, and remove npm .npmrc warning. GitGuardian checks verified successful on recent PRs #24–#26.

**2026-07-17T11:40:26Z**

Audit remediations complete locally: Cheerio updated to 1.2.0 / undici 7.28.0 and pnpm audit now reports zero production vulnerabilities; airport CSV URL pinned to immutable commit; CI permissions set to contents: read; README scraper/privacy notice and release docs refreshed; obsolete .npmrc removed. pnpm run verify and package-content check pass. GitGuardian Security Checks succeeded on PRs #24, #25, and #26 (most recent #25).

**2026-07-17T11:41:41Z**

Opened PR #27 for the release:prep reporting improvements: https://github.com/crcatala/hotella/pull/27
