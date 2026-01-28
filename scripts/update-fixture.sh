#!/usr/bin/env bash
# update-fixture.sh — Fetch a fresh Google Hotels page, extract card elements,
# and overwrite the test fixture. Also saves the raw HTML for debugging.
#
# Usage:
#   bash scripts/update-fixture.sh [location] [checkin] [checkout]
#
# Defaults:
#   location: Tokyo
#   checkin:  30 days from now
#   checkout: 37 days from now

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_DIR="$PROJECT_DIR/tests/fixtures"
RAW_DIR="$FIXTURE_DIR/.raw"

LOCATION="${1:-Tokyo}"
CHECKIN="${2:-$(date -d '+30 days' '+%Y-%m-%d' 2>/dev/null || date -v+30d '+%Y-%m-%d')}"
CHECKOUT="${3:-$(date -d '+37 days' '+%Y-%m-%d' 2>/dev/null || date -v+37d '+%Y-%m-%d')}"

mkdir -p "$RAW_DIR"

echo "Fetching Google Hotels for '$LOCATION' ($CHECKIN to $CHECKOUT)..."

# Use the CLI in dev mode to fetch raw HTML (via --debug we can see the URL)
# Build the URL the same way the fetcher does
CITY=$(echo "$LOCATION" | tr '[:upper:]' '[:lower:]' | tr ' ' '+')
URL="https://www.google.com/travel/hotels/${CITY}?q=hotels+in+${LOCATION}&hl=en&gl=us&cs=1&ssta=1&checkin=${CHECKIN}&checkout=${CHECKOUT}&guests=2&curr=USD"

RAW_FILE="$RAW_DIR/google-hotels-$(date +%Y%m%d-%H%M%S).html"
FIXTURE_FILE="$FIXTURE_DIR/google-hotels-cards.html"

# Fetch the page using curl (impit is a library, not a CLI tool)
if command -v curl &>/dev/null; then
  curl -sL \
    -H "Accept: text/html,application/xhtml+xml" \
    -H "Accept-Language: en-US,en;q=0.5" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    "$URL" > "$RAW_FILE"
else
  echo "Error: curl is required"
  exit 1
fi

RAW_SIZE=$(wc -c < "$RAW_FILE" | tr -d ' ')
echo "Saved raw HTML to $RAW_FILE ($RAW_SIZE bytes)"

# Extract hotel card divs using node + cheerio
node -e "
const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('$RAW_FILE', 'utf-8');
const \$ = cheerio.load(html);
const cards = [];
\$('div.uaTTDe').each((i, el) => {
  cards.push(\$.html(el));
});
if (cards.length === 0) {
  console.error('WARNING: No hotel cards found (div.uaTTDe). Selectors may have changed.');
  process.exit(1);
}
const fixture = [
  '<!--',
  '  Extracted from Google Hotels on $(date +%Y-%m-%d).',
  '  Location: $LOCATION | Dates: $CHECKIN to $CHECKOUT',
  '  Cards: ' + cards.length,
  '-->',
  '<!DOCTYPE html>',
  '<html lang=\"en\">',
  '<head><meta charset=\"utf-8\"><title>Hotels fixture</title></head>',
  '<body>',
  '',
  cards.join('\n\n'),
  '',
  '</body>',
  '</html>',
].join('\n');
fs.writeFileSync('$FIXTURE_FILE', fixture);
console.log('Extracted ' + cards.length + ' hotel cards to fixture.');
"

echo "Done. Fixture updated at $FIXTURE_FILE"
