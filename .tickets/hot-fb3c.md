---
id: hot-fb3c
status: open
deps: [hot-2758]
links: []
created: 2026-01-27T21:52:17Z
type: feature
priority: 3
assignee: cc-vps
tags: [future, command]
---
# Details command: scrape individual hotel info

Add a 'hotella details <url>' command to scrape detailed info from a specific Google Hotels page.

Would extract: detailed reviews, room types, photos, full amenity list, booking links with prices from multiple providers.

## ⚠️ Design Decisions Needed

This ticket requires research and design work before implementation:
- What does the Google Hotels detail page structure look like? Need to inspect and document selectors.
- What data is reliably extractable vs. dynamically loaded (may need JS execution)?
- Should this accept a hotel name + dates instead of a raw URL?
- Output format design for room types and multi-provider pricing.

Recommend: spike/research task first, then refine acceptance criteria before starting.

## Acceptance Criteria

- Accepts a Google Hotels URL
- Extracts detailed hotel info
- Shows room types and multi-provider pricing

