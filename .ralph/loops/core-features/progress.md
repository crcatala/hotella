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

- IATA resolution in `src/lib/iata.ts`; `resolveLocation()` is async (fetches CSV); integrated before query construction in search command
- CSV cache at `~/.cache/hotella/airports.csv` with 7-day TTL; fallback list bundled for offline use
- Table formatter lives in `src/lib/table.ts` as pure functions, following the same pattern as filters
- `OutputFormat` type in `src/cli/context.ts` controls format; `--table` detected in `createContext` argv parsing
- `formatTableRow` and `formatTableOutput` are exported separately for unit testing

---

## [2026-01-27 15:37] - hot-9387
- Implemented improved user-friendly error messages
- Past dates rejected with actionable message: "Check-in date YYYY-MM-DD is in the past. Use a future date."
- Network errors wrapped with ApiError: "Failed to connect to Google Hotels. Check your internet connection."
- Rate limiting (429 or short HTML) suggests waiting and retrying
- Parse failure (0 hotels from non-empty HTML >5KB) shows: "Failed to parse hotel data... Try --debug for details."
- No results shows: 'No hotels found for "X". Try a different location or broader dates.'
- Fetcher errors wrapped with user-friendly ApiError messages
- Files changed: `src/lib/fetcher.ts`, `src/commands/search.ts`, `tests/unit/errors.test.ts` (new)
- **Learnings:** Fetcher already threw plain `Error`; replaced with `ApiError` imports from `../cli/errors.js`; network errors caught by wrapping the entire fetch call in try/catch
---

## [2026-01-27 15:36] - hot-e7c5
- Implemented IATA airport code → city resolution
- Created `src/lib/iata.ts` with `resolveLocation()`, `parseAirportsCsv()`, `isIataCode()`, and `FALLBACK_AIRPORTS`
- CSV fetched from GitHub, cached to `~/.cache/hotella/airports.csv` with 7-day TTL
- CITY_OVERRIDES map handles ~70 common airports where CSV city column has suburb names (JFK→"New York", CDG→"Paris", etc.)
- Non-IATA inputs (city names, multi-word) pass through unchanged
- Verbose output shows `→ Resolving location "NRT" → "Tokyo"`
- Integrated into search command: resolves location before building query
- Files changed: `src/lib/iata.ts` (new), `tests/unit/iata.test.ts` (new), `src/commands/search.ts`
- **Learnings:** Tests that interact with file system caching need save/restore of cache files; `resolveLocation` uppercases input internally so lowercase codes work too
---

## [2026-01-27 15:32] - hot-8726
- Implemented table output format with `--table` flag
- Added `'table'` to `OutputFormat` type in `src/cli/context.ts`
- Added `--table` option to global options in `src/cli/program.ts`
- Created `src/lib/table.ts` with `formatTableRow` and `formatTableOutput` functions
- Columns: Name (35), Price (8, right-aligned), Rating (6), Amenities (30+)
- Truncation with ellipsis for long names/amenities; N/A for null price, `-` for null rating
- Integrated into search command output path
- Files changed: `src/cli/context.ts`, `src/cli/program.ts`, `src/commands/search.ts`, `src/lib/table.ts` (new), `tests/unit/table.test.ts` (new)
- **Learnings:** Table format follows same header/summary structure as plain output for consistency
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
