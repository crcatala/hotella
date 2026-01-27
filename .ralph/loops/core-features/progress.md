# Ralph Progress Log: core-features
Started: 2026-01-27T23:20:21.958Z

## Codebase Patterns
- Test helper `makeHotel()` pattern: create with defaults + `Partial<Hotel>` overrides
- Tests live in `tests/unit/<module>.test.ts`, mirroring `src/lib/<module>.ts`
- Filters/transforms go in `src/lib/` as pure functions, wired into `src/commands/search.ts`
- Run `npx prettier --write <file>` to fix formatting before verify
- Commander options with dashes (e.g. `--min-price`) become camelCase in opts (`opts.minPrice`)
- `extractPrice` and `CURRENCY_SYMBOLS` are exported from `src/lib/parser.ts` for reuse and testing
- EUR uses period as thousands separator (1.234 = 1234); other currencies use comma

---

## [2026-01-27 15:30] - hot-8075
- Implemented multi-currency price parsing and --currency flag
- Added `--currency <code>` option (USD, EUR, GBP, JPY, TWD) to search command with validation
- Enhanced `extractPrice` in parser.ts: exported function, EUR period-as-thousands handling, robust numeric parsing
- Exported `CURRENCY_SYMBOLS` map for plain output display (correct symbol per currency)
- Currency passed to fetcher as `curr` query param (already wired in fetcher.ts)
- Plain output now shows appropriate currency symbol instead of hardcoded `$`
- Files changed: `src/lib/parser.ts`, `src/commands/search.ts`, `tests/unit/parser-currency.test.ts` (new)
- **Learnings:** Parser already had CURRENCY_PATTERNS but extractPrice was not exported; EUR thousands separator uses period not comma
---

## [2026-01-27 15:29] - hot-a6e9
- Implemented client-side price and rating filters
- New file: `src/lib/filters.ts` with `filterByPrice` and `filterByRating` functions
- Added `--min-price`, `--max-price`, `--min-rating` options to search command
- Filters applied after parsing, before sorting; null values excluded when filter active
- Verbose output shows filtered count; "No hotels match your filters." when all filtered out
- `--min-rating` validated to 0-5 range
- Files changed: `src/lib/filters.ts` (new), `src/commands/search.ts`, `tests/unit/filters.test.ts` (new)
- **Learnings:** Commander camelCases dashed option names automatically
---
