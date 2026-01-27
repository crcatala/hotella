import type { Command } from 'commander'
import type { CliContext } from '../cli/context.js'
import { UsageError } from '../cli/errors.js'
import { logDebug, logVerbose, output } from '../cli/output.js'
import { fetchHotelsHtml } from '../lib/fetcher.js'
import { parseHotelsHtml } from '../lib/parser.js'
import { type SortMode, sortHotels } from '../lib/sort.js'
import type { Hotel, SearchQuery, SearchResult } from '../lib/types.js'

function validateDate(value: string, label: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    throw new UsageError(`Invalid ${label} date "${value}". Use YYYY-MM-DD format (e.g., 2026-02-10).`)
  }
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    throw new UsageError(`Invalid ${label} date "${value}".`)
  }
  return value
}

function formatPlainOutput(result: SearchResult): string {
  const { query, hotels, summary } = result
  const checkinDate = new Date(`${query.checkin}T00:00:00`)
  const checkoutDate = new Date(`${query.checkout}T00:00:00`)
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const lines: string[] = []
  lines.push(
    `Hotels in ${query.location} · ${formatDate(checkinDate)}–${formatDate(checkoutDate)} · ${query.adults} adult${query.adults !== 1 ? 's' : ''}`,
  )
  lines.push('')

  if (hotels.length === 0) {
    lines.push('No hotels found.')
    return lines.join('\n')
  }

  for (let i = 0; i < hotels.length; i++) {
    const h = hotels[i]
    const num = `${(i + 1).toString().padStart(2)}.`
    const priceStr = h.price !== null ? `$${h.price}/night` : 'Price N/A'
    const ratingStr = h.rating !== null ? `★ ${h.rating}` : ''
    const amenityStr = h.amenities.length > 0 ? h.amenities.slice(0, 3).join(', ') : ''

    lines.push(` ${num} ${h.name}`)
    const details = [priceStr, ratingStr, amenityStr].filter(Boolean).join(' · ')
    lines.push(`     ${details}`)
    lines.push('')
  }

  if (summary.lowestPrice !== null) {
    lines.push(`Found ${summary.total} hotels · Lowest: $${summary.lowestPrice}/night`)
  } else {
    lines.push(`Found ${summary.total} hotels`)
  }

  return lines.join('\n')
}

export function registerSearchCommand(program: Command, ctx: CliContext): void {
  program
    .command('search')
    .description('Search hotels in a location')
    .argument('<location>', 'City name or location to search')
    .requiredOption('--checkin <date>', 'Check-in date (YYYY-MM-DD)')
    .requiredOption('--checkout <date>', 'Check-out date (YYYY-MM-DD)')
    .option('--adults <n>', 'Number of adults (1-9)', '2')
    .option('--children <n>', 'Number of children (0-8)', '0')
    .option('--sort <mode>', 'Sort: price-asc, price-desc, rating, value', 'value')
    .option('--limit <n>', 'Max results to show', '20')
    .option('--browser <type>', 'Browser to impersonate: chrome or firefox', 'chrome')
    .action(async (location: string, opts: Record<string, string>) => {
      // Validate dates
      const checkin = validateDate(opts.checkin, 'check-in')
      const checkout = validateDate(opts.checkout, 'check-out')

      if (checkin >= checkout) {
        throw new UsageError('Check-out date must be after check-in date.')
      }

      // Validate guests
      const adults = Number.parseInt(opts.adults, 10)
      const children = Number.parseInt(opts.children, 10)
      if (Number.isNaN(adults) || adults < 1 || adults > 9) {
        throw new UsageError('Adults must be between 1 and 9.')
      }
      if (Number.isNaN(children) || children < 0 || children > 8) {
        throw new UsageError('Children must be between 0 and 8.')
      }
      if (adults + children > 9) {
        throw new UsageError('Total guests (adults + children) cannot exceed 9.')
      }

      // Validate sort
      const validSorts: SortMode[] = ['price-asc', 'price-desc', 'rating', 'value']
      if (!validSorts.includes(opts.sort as SortMode)) {
        throw new UsageError(
          `Invalid sort mode "${opts.sort}". Use: ${validSorts.join(', ')}`,
        )
      }

      const limit = Number.parseInt(opts.limit, 10)
      if (Number.isNaN(limit) || limit < 1) {
        throw new UsageError('Limit must be a positive number.')
      }

      const query: SearchQuery = {
        location,
        checkin,
        checkout,
        adults,
        children,
        currency: 'USD',
      }

      logVerbose(ctx, `Searching hotels in "${location}"...`)
      logDebug(ctx, 'Search query:', query)

      // Fetch
      const browser = opts.browser as 'chrome' | 'firefox'
      const { html, url } = await fetchHotelsHtml(query, browser)
      logVerbose(ctx, `Fetched ${(html.length / 1024).toFixed(0)}KB from Google Hotels`)
      logDebug(ctx, `URL: ${url}`)

      // Parse
      let hotels = parseHotelsHtml(html, query.currency)
      logVerbose(ctx, `Parsed ${hotels.length} hotels`)

      if (hotels.length === 0) {
        logDebug(ctx, 'No hotel cards found. HTML may have changed structure.', {
          htmlLength: html.length,
          hasUaTTDe: html.includes('uaTTDe'),
          hasBgYkof: html.includes('BgYkof'),
        })
      }

      // Sort
      hotels = sortHotels(hotels, opts.sort as SortMode)

      // Limit
      hotels = hotels.slice(0, limit)

      // Build result
      const prices = hotels.map((h) => h.price).filter((p): p is number => p !== null)
      const result: SearchResult = {
        query,
        hotels,
        summary: {
          total: hotels.length,
          lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
          highestPrice: prices.length > 0 ? Math.max(...prices) : null,
        },
      }

      // Output
      if (ctx.output.format === 'json') {
        output(JSON.stringify(result, null, 2))
      } else {
        output(formatPlainOutput(result))
      }
    })
}
