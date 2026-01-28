# Ralph Progress Log: polish
Started: 2026-01-27T23:20:22.132Z

## Codebase Patterns
- Test helper `makeHotel()` pattern used across test files for creating Hotel objects with partial overrides
- vitest.config.ts excludes `tests/live/**` from default runs; live tests gated with `describe.skipIf(!LIVE)`
- Integration tests use `npx tsx src/cli.ts` as subprocess for CLI testing, with `NO_COLOR=1` env
- `scripts/test-unit.sh` targets `tests/unit tests/integration` directories explicitly
- Prettier only checks `src/**/*.ts` in verify — test files need manual formatting if changed

---

## [2026-01-27 15:58] - hot-c9fd
- Created HTML fixture at `tests/fixtures/google-hotels-cards.html` with 9 cards (8 valid) covering: normal hotel, missing price, missing rating, mixed-language name, many amenities, high price with comma, empty name (skipped), aria-label rating fallback
- Created `scripts/update-fixture.sh` to fetch fresh Google Hotels pages and extract card elements, with raw HTML saved to gitignored `.raw/` directory
- Added `tests/fixtures/.raw/` to `.gitignore`
- Created `tests/unit/parser.test.ts` — 16 tests parsing fixture HTML to Hotel[], covering name/price/rating/amenities/URL extraction and edge cases
- Enhanced `tests/unit/sort.test.ts` — 12 tests covering all sort modes with edge cases (all nulls, single result, empty array, immutability)
- Created `tests/unit/cli.test.ts` — 15 tests for arg parsing, help output, context creation, validation of options
- Created `tests/integration/cli.test.ts` — 11 subprocess tests verifying exit codes (0, 2), stdout/stderr separation, validation errors
- Created `tests/live/search.live.test.ts` — gated behind HOTELLA_LIVE_TEST=1, tests real fetch+parse
- Total: 133 tests across 9 test files, all passing
- Files changed: `.gitignore`, `vitest.config.ts`, `tests/fixtures/google-hotels-cards.html`, `scripts/update-fixture.sh`, `tests/unit/parser.test.ts`, `tests/unit/sort.test.ts`, `tests/unit/cli.test.ts`, `tests/integration/cli.test.ts`, `tests/live/search.live.test.ts`
- **Learnings:** vitest `exclude` in config prevents files from being found even when explicitly passed as path args. Live tests must use `describe.skipIf()` as the primary gate. The verify script counts test FILES not individual tests (shows "9 passed").
---
