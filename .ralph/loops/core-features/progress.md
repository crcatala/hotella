# Ralph Progress Log: core-features
Started: 2026-01-27T23:20:21.958Z

## Codebase Patterns
- Test helper `makeHotel()` pattern: create with defaults + `Partial<Hotel>` overrides
- Tests live in `tests/unit/<module>.test.ts`, mirroring `src/lib/<module>.ts`
- Filters/transforms go in `src/lib/` as pure functions, wired into `src/commands/search.ts`
- Run `npx prettier --write <file>` to fix formatting before verify
- Commander options with dashes (e.g. `--min-price`) become camelCase in opts (`opts.minPrice`)

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
