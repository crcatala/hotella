# hotella

Search hotel prices and availability from the terminal via Google Hotels.

> **Status:** MVP spike — functional but not production-ready.

## How it works

Uses [impit](https://github.com/nichochar/impit) (browser impersonation HTTP client) to fetch Google Hotels search results, then parses the HTML with [cheerio](https://cheerio.js.org/) to extract hotel names, prices, ratings, amenities, and URLs.

Google Hotels is a meta-search aggregator pulling prices from Booking.com, Expedia, Hotels.com, and direct hotel sites — so you get multi-platform price comparison from a single source.

## Usage

```bash
# Install dependencies
pnpm install

# Basic search
pnpm dev search "Taipei" --checkin 2026-02-10 --checkout 2026-02-17

# With options
pnpm dev search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05 \
  --adults 2 --limit 5 --sort price-asc

# JSON output for scripting
pnpm dev search "Paris" --checkin 2026-04-01 --checkout 2026-04-03 --json | jq '.hotels[].name'

# Verbose/debug
pnpm dev search "London" --checkin 2026-05-01 --checkout 2026-05-05 --verbose
pnpm dev search "London" --checkin 2026-05-01 --checkout 2026-05-05 --debug
```

## Search options

| Flag | Default | Description |
|------|---------|-------------|
| `--checkin <date>` | required | Check-in date (YYYY-MM-DD) |
| `--checkout <date>` | required | Check-out date (YYYY-MM-DD) |
| `--adults <n>` | 2 | Number of adults (1-9) |
| `--children <n>` | 0 | Number of children (0-8) |
| `--sort <mode>` | value | `price-asc`, `price-desc`, `rating`, `value` |
| `--limit <n>` | 20 | Max results to show |
| `--browser <type>` | chrome | Browser to impersonate: `chrome` or `firefox` |
| `--json` | — | JSON output |
| `--plain` | — | Plain text output (default in terminal) |

## Output formats

**Plain (default in terminal):**
```
Hotels in Taipei · Feb 10, 2026–Feb 17, 2026 · 2 adults

  1. MEANDER Taipei
     $32/night · ★ 4.6 · Free Wi-Fi, Air conditioning, Smoke-free property

  2. Grand Hyatt Taipei
     $271/night · ★ 4.4 · Breakfast ($), Free Wi-Fi, Free parking

Found 20 hotels · Lowest: $22/night
```

**JSON** outputs a structured `SearchResult` object with `query`, `hotels[]`, and `summary`.

## Future enhancements

- Table output format
- Currency selection (`--currency TWD`)
- Price/rating filters (`--min-price`, `--max-price`, `--min-rating`)
- IATA airport code resolution
- Full test suite with fixtures
