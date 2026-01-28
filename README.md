# hotella

Search hotel prices and availability from the terminal via Google Hotels.

Uses browser impersonation to fetch Google Hotels results — no headless browser, no API key, ~0.3s response time. Get multi-platform price comparison (Booking.com, Expedia, Hotels.com, and direct hotel sites) from a single command.

## Quick Start

```bash
npx hotella search "Taipei" --checkin 2026-02-10 --checkout 2026-02-17
```

## Installation

```bash
# npm
npm install -g hotella

# pnpm
pnpm add -g hotella

# Or run directly with npx
npx hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05
```

Requires **Node.js 22** or later.

## Usage

### Basic Search

```bash
hotella search "Paris" --checkin 2026-04-01 --checkout 2026-04-03
```

### Sort and Limit Results

```bash
# Cheapest 5 hotels
hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05 --sort price-asc --limit 5

# Highest rated
hotella search "London" --checkin 2026-05-01 --checkout 2026-05-05 --sort rating --limit 10
```

### Airport Codes

Use IATA airport codes instead of city names — hotella resolves them automatically:

```bash
# NRT → Tokyo/Narita
hotella search "NRT" --checkin 2026-06-01 --checkout 2026-06-07

# CDG → Paris/Charles de Gaulle
hotella search "CDG" --checkin 2026-04-01 --checkout 2026-04-03
```

### Filters

```bash
# Hotels under $150/night with 4+ stars
hotella search "Berlin" --checkin 2026-06-01 --checkout 2026-06-05 \
  --max-price 150 --min-rating 4

# Price range
hotella search "NYC" --checkin 2026-07-01 --checkout 2026-07-03 \
  --min-price 100 --max-price 300
```

### Currency

```bash
# Prices in Euros
hotella search "Berlin" --checkin 2026-06-01 --checkout 2026-06-05 --currency EUR

# Prices in Japanese Yen
hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05 --currency JPY
```

Supported currencies: `USD`, `EUR`, `GBP`, `JPY`, `TWD`.

### JSON Output for Scripting

```bash
# Pipe to jq
hotella search "Paris" --checkin 2026-04-01 --checkout 2026-04-03 --json | jq '.hotels[].name'

# Save to file
hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05 --json > results.json
```

JSON is automatically selected when output is piped.

## CLI Reference

```
hotella search [options] <location>
```

### Arguments

| Argument   | Description                               |
|------------|-------------------------------------------|
| `location` | City name, location, or IATA airport code |

### Options

| Flag               | Default   | Description                                     |
|--------------------|-----------|-------------------------------------------------|
| `--checkin <date>` | required  | Check-in date (YYYY-MM-DD)                      |
| `--checkout <date>`| required  | Check-out date (YYYY-MM-DD)                     |
| `--adults <n>`     | `2`       | Number of adults (1–9)                           |
| `--children <n>`   | `0`       | Number of children (0–8)                         |
| `--sort <mode>`    | `value`   | `price-asc`, `price-desc`, `rating`, `value`    |
| `--limit <n>`      | `20`      | Max results to show                              |
| `--min-price <n>`  | —         | Minimum price per night                          |
| `--max-price <n>`  | —         | Maximum price per night                          |
| `--min-rating <n>` | —         | Minimum rating (0–5)                             |
| `--currency <code>`| `USD`     | Currency code: USD, EUR, GBP, JPY, TWD           |
| `--browser <type>` | `chrome`  | Browser to impersonate: `chrome` or `firefox`    |

### Global Options

| Flag        | Description                                 |
|-------------|---------------------------------------------|
| `--json`    | Structured JSON output                      |
| `--plain`   | Human-readable list output                  |
| `--table`   | Aligned columnar table output               |
| `--verbose` | Show operational progress                   |
| `--debug`   | Show debug information (implies `--verbose`)|
| `--no-color`| Disable colors                              |
| `--version` | Show version number                         |
| `--help`    | Show help                                   |

### Environment Variables

| Variable   | Description                                          |
|------------|------------------------------------------------------|
| `NO_COLOR` | Disable all color output (see https://no-color.org)  |

## Output Formats

### Plain (default in TTY)

```
Hotels in Taipei · Feb 10, 2026–Feb 17, 2026 · 2 adults

  1. MEANDER Taipei
     $32/night · ★ 4.6 · Free Wi-Fi, Air conditioning, Smoke-free property

  2. Grand Hyatt Taipei
     $271/night · ★ 4.4 · Breakfast ($), Free Wi-Fi, Free parking

Found 20 hotels · Lowest: $22/night
```

### Table

```
hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05 --table
```

Displays results in an aligned columnar table with hotel name, price, rating, and amenities.

### JSON

```json
{
  "query": {
    "location": "Taipei",
    "checkin": "2026-02-10",
    "checkout": "2026-02-17",
    "adults": 2,
    "children": 0
  },
  "hotels": [
    {
      "name": "MEANDER Taipei",
      "price": 32,
      "currency": "USD",
      "rating": 4.6,
      "amenities": ["Free Wi-Fi", "Air conditioning", "Smoke-free property"],
      "url": "https://www.google.com/travel/hotels/..."
    }
  ],
  "summary": {
    "total": 20,
    "lowestPrice": 22
  }
}
```

## How It Works

1. **Fetch** — [impit](https://github.com/nichochar/impit) impersonates a real browser (Chrome or Firefox TLS fingerprint + headers) to fetch Google Hotels search results as HTML. No headless browser or Puppeteer needed.
2. **Parse** — [cheerio](https://cheerio.js.org/) extracts hotel cards from the HTML: names, prices, ratings, amenities, and booking URLs.
3. **Filter & Sort** — Results are filtered by price/rating constraints and sorted by the chosen mode.
4. **Format** — Output is rendered as plain text, a table, or JSON depending on the output flag and whether stdout is a TTY.

The whole pipeline runs in ~0.3s — a single HTTP request with no browser overhead.

## Known Limitations

- **Scraping fragility** — Google Hotels HTML structure can change without notice, which may break parsing. Run `pnpm test` to check if selectors still work.
- **Rate limiting** — Rapid or automated use may trigger Google's bot detection. The browser impersonation helps, but isn't foolproof.
- **Currency support** — Limited to USD, EUR, GBP, JPY, and TWD. Google may not honor all currency requests for all regions.
- **Result count** — Returns only the first page of results from Google Hotels (typically 15–25 hotels).
- **No caching** — Every search makes a fresh HTTP request.

## Development

### Setup

```bash
git clone https://github.com/your-username/hotella.git
cd hotella
pnpm install
```

### Running

```bash
# Development mode
pnpm dev search "Taipei" --checkin 2026-02-10 --checkout 2026-02-17

# Build
pnpm build
```

### Testing

```bash
# Run all non-live tests
pnpm test

# Run tests with verbose output
pnpm test:verbose

# Run live tests (makes real HTTP requests)
pnpm test:live

# Watch mode
pnpm test:watch
```

### Verification

```bash
# Run all checks: tests, linting, formatting, type checking
pnpm run verify
```

### Project Structure

```
src/
├── cli.ts              # Entry point
├── cli/
│   ├── program.ts      # Commander program setup
│   ├── context.ts      # CLI context (colors, output mode)
│   ├── spinner.ts      # Terminal spinner
│   ├── errors.ts       # Error handling
│   └── output.ts       # Output formatting (plain/json/table)
├── commands/
│   └── search.ts       # Search command implementation
└── lib/
    ├── fetcher.ts       # HTTP fetching via impit
    ├── parser.ts        # HTML parsing with cheerio
    ├── sort.ts          # Sort modes
    ├── filters.ts       # Price/rating filters
    ├── table.ts         # Table formatter
    ├── iata.ts          # IATA airport code resolution
    └── types.ts         # TypeScript types

tests/
├── unit/               # Unit tests (parser, sort, CLI args)
├── integration/        # Subprocess CLI tests
├── live/               # Live network tests (opt-in)
└── fixtures/           # HTML fixtures for parser tests

scripts/
├── verify.ts           # Pre-commit verification
└── update-fixture.sh   # Refresh HTML test fixtures
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and ensure `pnpm run verify` passes
4. Commit with a descriptive message
5. Open a pull request

Please keep changes focused and include tests for new functionality.

## License

MIT
