---
id: hot-a6e9
status: open
deps: []
links: []
created: 2026-01-27T21:51:13Z
type: feature
priority: 2
assignee: cc-vps
tags: [core, filters]
---
# Client-side price and rating filters

Implement client-side filtering with --min-price, --max-price, and --min-rating flags.

Implementation (src/lib/filters.ts):
- filterByPrice(hotels, min?, max?): exclude hotels with null prices when filtering; keep hotels within range
- filterByRating(hotels, min?): exclude hotels with null ratings when filtering; keep hotels at or above threshold

CLI changes (src/commands/search.ts):
- Add --min-price <n> option
- Add --max-price <n> option  
- Add --min-rating <n> option (validate 0-5 range)
- Apply filters after parsing, before sorting
- Verbose output: '→ Filtered: 15 of 20 hotels match criteria'
- Summary should reflect post-filter counts

Edge cases:
- Hotels with null price: excluded when price filter is active
- Hotels with null rating: excluded when rating filter is active
- All hotels filtered out: show 'No hotels match your filters' message
- Only min or only max specified: open-ended range

Testing:
- Unit tests for filterByPrice with various min/max combinations
- Unit tests for filterByRating
- Unit tests for null handling
- Integration test: search with --min-rating 4.5 returns fewer results

## Acceptance Criteria

- --min-price, --max-price, --min-rating flags work correctly
- Null prices/ratings excluded when respective filter is active
- Summary counts reflect filtered results
- Clear message when all results filtered out

