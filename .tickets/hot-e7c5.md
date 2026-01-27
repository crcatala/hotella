---
id: hot-e7c5
status: open
deps: [hot-2758]
links: []
created: 2026-01-27T21:51:13Z
type: feature
priority: 2
assignee: cc-vps
tags: [core, fetcher]
---
# IATA airport code → city resolution

Implement src/lib/iata.ts so users can pass airport codes (e.g. NRT, TPE) as the location argument instead of city names.

Requirements:
- Fetch IATA CSV from https://raw.githubusercontent.com/lxndrblz/Airports/refs/heads/main/airports.csv
- Cache to ~/.cache/hotella/airports.csv with 7-day TTL
- Expose resolveLocation(input: string): Promise<string> — returns city name if input is a 3-letter IATA code, otherwise returns input unchanged
- Integrate into search command: resolve location before passing to fetcher
- Verbose output: '→ Resolving location "NRT" → "Tokyo"'
- Bundle a fallback list of ~50 common airports in case CSV source is unavailable

Testing:
- Unit tests with mocked fetch for CSV download
- Unit tests for cache TTL logic (expired vs fresh)
- Unit tests for code resolution (valid code, invalid code, passthrough for city names)
- Live test: search using 'TPE' should return Taipei hotels

## Notes

CSV source verified 2026-01-27:
- URL returns HTTP 200, ~9800 rows, well-structured (code,icao,name,...,city,...)
- Repo: github.com/lxndrblz/Airports — 204 stars, last pushed 2025-10-11, actively maintained
- Confirmed NRT→Tokyo(via city_code TYO), TPE→Taoyuan City, CDG→Paris(via city_code PAR), JFK→Inwood(via city_code NYC), LAX→El Segundo
- Note: the `city` column is sometimes the suburb, not the metro name. The `city_code` column maps to metro areas (TYO, NYC, PAR). Consider resolving via city_code to a known metro name, or using the city column with a small override map for common cases.

## Acceptance Criteria

- Airport codes like NRT, TPE, CDG resolve to city names
- CSV is cached locally with 7-day TTL
- Non-IATA inputs pass through unchanged
- Works offline after first cache

