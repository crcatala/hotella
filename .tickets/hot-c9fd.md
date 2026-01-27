---
id: hot-c9fd
status: open
deps: [hot-8075, hot-a6e9, hot-8726, hot-e7c5, hot-2758]
links: []
created: 2026-01-27T21:51:54Z
type: task
priority: 1
assignee: cc-vps
tags: [quality, testing]
---
# Comprehensive test suite with HTML fixtures

Build out the full test suite as described in the implementation plan's testing strategy.

Fixture setup:
- Save a real Google Hotels HTML response as tests/fixtures/google-hotels.html
- Gzip it (~2.7MB → ~250KB): tests/fixtures/google-hotels.html.gz
- Load in tests via gunzipSync(readFileSync(...))
- Alternatively, extract just the relevant hotel card divs into a smaller fixture

Unit tests (tests/unit/):
- parser.test.ts: Parse fixture HTML → correct Hotel[]. Test name, price, rating, amenities, URL extraction. Edge cases: missing price, missing rating, Chinese/mixed-language names, no cards found.
- sort.test.ts: All sort modes (price-asc, price-desc, rating, value). Edge cases: all prices null, single result, empty array, nulls-last behavior.
- cli.test.ts: Arg parsing, help output, validation errors (bad dates, invalid guest counts, date ordering).

Integration tests (tests/integration/):
- cli.test.ts: Subprocess tests using child_process.execFile. Verify exit codes (0, 1, 2), stdout/stderr separation, --json produces valid JSON, --plain produces expected format, --help exits 0.

Live tests (tests/live/):
- search.live.test.ts: Real Google Hotels fetch + parse. Gated behind HOTELLA_LIVE_TEST=1 env var. Verify returns >0 hotels with valid structure.

Vitest config:
- Exclude tests/live/** from default test runs
- Add script: 'test:live' that sets env var and includes live tests

## Acceptance Criteria

- Unit tests cover parser, sort, and CLI arg validation
- Integration tests verify exit codes and output format via subprocess
- Live tests gated behind env var
- All non-live tests pass in CI without network access
- HTML fixture committed (gzipped if large)

