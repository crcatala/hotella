# hotella

Search hotel prices and availability from the terminal via Google Hotels.

Compare prices from Booking.com, Expedia, Hotels.com, and direct hotel sites in a single command.

## Quick Start

```bash
npx hotella search "Taipei" \
  --checkin "$(node -e 'console.log(new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10))')" \
  --checkout "$(node -e 'console.log(new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10))')"
```

## Installation

```bash
# npm
npm install -g hotella

# pnpm
pnpm add -g hotella

# Or run directly with npx
npx hotella --help
```

Requires **Node.js 22** or later.

## Usage

Use future dates in `YYYY-MM-DD` format. The Quick Start command above generates them automatically.

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

## Development

### Setup

```bash
git clone https://github.com/crcatala/hotella.git
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

## Contributing

Hotella is personally maintained and is not accepting code contributions, pull requests, or feature requests. Bug reports with a clear reproduction are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Releasing

Maintainers can follow [RELEASING.md](RELEASING.md) for the manual release process.

## License

MIT
