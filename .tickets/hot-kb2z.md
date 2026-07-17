---
id: hot-kb2z
status: in_progress
deps: []
links: []
created: 2026-07-17T12:44:01Z
type: task
priority: 2
assignee: cc-vps
parent: hot-fe21
---
# Add IATA dataset refresh workflow

Add a maintainer command to validate and pin the latest immutable Airports dataset revision, with documented review workflow.


## Notes

**2026-07-17T12:45:32Z**

Implemented an IATA refresh command that resolves and validates the latest immutable upstream commit, updates the pin, and prints PR-review next steps. Added maintainer workflow documentation and removed test coupling to a specific revision.

**2026-07-17T12:51:04Z**

Addressed refresh-workflow review findings: runtime and refresh validation now normalize BOM/whitespace headers; refresh output compares old/new mappings (added, removed, city-name changes) and links the upstream diff; added focused validation/comparison tests.

**2026-07-17T13:11:10Z**

Added mocked command-flow coverage for dirty worktree, revision update, and no-op behavior; expanded formatting checks to scripts, tests, and README. Validation: pnpm run format, pnpm test, pnpm run verify.
