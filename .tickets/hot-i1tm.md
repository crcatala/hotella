---
id: hot-i1tm
status: closed
deps: []
links: []
created: 2026-07-17T06:14:51Z
type: task
priority: 2
assignee: cc-vps
---
# Add end-to-end live CLI coverage

Add opt-in live CLI integration tests for JSON output, filtering/limit behavior, and non-default currency handling. Keep assertions structural to avoid flaky Google Hotels data expectations.

## Acceptance Criteria

Live tests exercise compiled CLI success paths for JSON, filters/limit, and EUR currency without asserting volatile hotel details.


## Notes

**2026-07-17T06:14:53Z**

Started implementation. Existing live fetch/parse test has also been updated for Vitest 4's options argument migration.

**2026-07-17T06:17:08Z**

Implemented compiled-CLI live coverage for JSON output, rating filter/limit behavior, and EUR currency. Verified all four opt-in live tests locally; normal suite and typecheck pass.
