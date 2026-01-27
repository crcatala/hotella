---
id: hot-61bb
status: open
deps: [hot-c9fd, hot-2758]
links: []
created: 2026-01-27T21:52:17Z
type: feature
priority: 3
assignee: cc-vps
tags: [future, command]
---
# Compare command: compare prices across date ranges

Add a 'hotella compare' command to compare hotel prices across multiple date ranges.

Usage:
  hotella compare "Taipei" --dates 2026-02-10:2026-02-17,2026-03-01:2026-03-07

This would fetch hotels for each date range and display a side-by-side comparison showing which dates are cheapest for the same hotel.

## ⚠️ Design Decisions Needed

This ticket requires design work before implementation:
- How to match "same hotel" across date ranges (name exact match? fuzzy? URL-based ID?)
- Output layout for side-by-side comparison — especially with many date ranges or many hotels
- Should it highlight the cheapest range per hotel?
- How to handle hotels that appear in one range but not another (show N/A or omit?)
- Performance: multiple fetches in parallel or sequential? Rate limiting concerns?

Recommend: mock up the desired output format first, then implement.

## Acceptance Criteria

- Compare command accepts multiple date ranges
- Shows price comparison across ranges for matching hotels
- Works with --json and --plain output formats

