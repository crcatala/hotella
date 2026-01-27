import type { Command } from 'commander'
import type { CliContext } from '../cli/context.js'
import { ApiError, UsageError } from '../cli/errors.js'
import { logDebug, logVerbose, output } from '../cli/output.js'
import { fetchHotelsHtml } from '../lib/fetcher.js'
import { filterByPrice, filterByRating } from '../lib/filters.js'
import { resolveLocation } from '../lib/iata.js'
import { CURRENCY_SYMBOLS, parseHotelsHtml } from '../lib/parser.js'
import { type SortMode, sortHotels } from '../lib/sort.js'
import { formatTableOutput } from '../lib/table.js'
import type { Hotel, SearchQuery, SearchResult } from '../lib/types.js'

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'TWD']

function validateDate(value: string, label: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    throw new UsageError(
      `Invalid ${label} date "${value}". Use YYYY-MM-DD format (e.g., 2026-02-10).`,
    )
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
    const sym = CURRENCY_SYMBOLS[query.currency] ?? query.currency + ' '
    const priceStr = h.price !== null ? `${sym}${h.price}/night` : 'Price N/A'
    const ratingStr = h.rating !== null ? `★ ${h.rating}` : ''
    const amenityStr = h.amenities.length > 0 ? h.amenities.slice(0, 3).join(', ') : ''

    lines.push(` ${num} ${h.name}`)
    const details = [priceStr, ratingStr, amenityStr].filter(Boolean).join(' · ')
    lines.push(`     ${details}`)
    lines.push('')
  }

  if (summary.lowestPrice !== null) {
    const sym = CURRENCY_SYMBOLS[query.currency] ?? query.currency + ' '
    lines.push(`Found ${summary.total} hotels · Lowest: ${sym}${summary.lowestPrice}/night`)
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
    .option('--min-price <n>', 'Minimum price per night')
    .option('--max-price <n>', 'Maximum price per night')
    .option('--min-rating <n>', 'Minimum rating (0-5)')
    .option('--currency <code>', 'Currency code: USD, EUR, GBP, JPY, TWD', 'USD')
    .option('--browser <type>', 'Browser to impersonate: chrome or firefox', 'chrome')
    .action(async (location: string, opts: Record<string, string>) => {
      // Validate dates
      const checkin = validateDate(opts.checkin, 'check-in')
      const checkout = validateDate(opts.checkout, 'check-out')

      // Reject past dates (compare YYYY-MM-DD strings — lexicographic ordering is correct)
      const todayStr = new Date().toISOString().slice(0, 10)
      if (checkin < todayStr) {
        throw new UsageError(`Check-in date ${checkin} is in the past. Use a future date.`)
      }

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
        throw new UsageError(`Invalid sort mode "${opts.sort}". Use: ${validSorts.join(', ')}`)
      }

      const limit = Number.parseInt(opts.limit, 10)
      if (Number.isNaN(limit) || limit < 1) {
        throw new UsageError('Limit must be a positive number.')
      }

      // Validate currency
      const currency = opts.currency.toUpperCase()
      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        throw new UsageError(
          `Unsupported currency "${opts.currency}". Use: ${SUPPORTED_CURRENCIES.join(', ')}`,
        )
      }

      // Resolve IATA airport codes to city names
      const locationResult = await resolveLocation(location)
      const resolvedLocation = locationResult.resolved
      if (locationResult.wasIata) {
        logVerbose(ctx, `Resolving location "${locationResult.original}" → "${resolvedLocation}"`)
      }

      const query: SearchQuery = {
        location: resolvedLocation,
        checkin,
        checkout,
        adults,
        children,
        currency,
      }

      logVerbose(ctx, `Searching hotels in "${resolvedLocation}"...`)
      logDebug(ctx, 'Search query:', query)

      // Fetch
      const browser = opts.browser as 'chrome' | 'firefox'
      const { html, url } = await fetchHotelsHtml(query, browser)
      logVerbose(ctx, `Fetched ${(html.length / 1024).toFixed(0)}KB from Google Hotels`)
      logDebug(ctx, `URL: ${url}`)

      // Parse
      let hotels = parseHotelsHtml(html, query.currency)
      logVerbose(ctx, `Parsed ${hotels.length} hotels`)

      if (hotels.length === 0 && html.length > 5000) {
        // Non-empty HTML but no hotels parsed — likely a layout change
        logDebug(ctx, 'No hotel cards found. HTML may have changed structure.', {
          htmlLength: html.length,
          hasUaTTDe: html.includes('uaTTDe'),
          hasBgYkof: html.includes('BgYkof'),
        })
        throw new ApiError(
          'Failed to parse hotel data. Google may have changed their page layout. Try --debug for details.',
        )
      }

      if (hotels.length === 0) {
        output(
          `No hotels found for "${resolvedLocation}". Try a different location or broader dates.`,
        )
        return
      }

      // Filter
      const totalBeforeFilter = hotels.length
      const minPrice = opts.minPrice !== undefined ? Number.parseFloat(opts.minPrice) : undefined
      const maxPrice = opts.maxPrice !== undefined ? Number.parseFloat(opts.maxPrice) : undefined
      const minRating = opts.minRating !== undefined ? Number.parseFloat(opts.minRating) : undefined

      if (minPrice !== undefined && (Number.isNaN(minPrice) || minPrice < 0)) {
        throw new UsageError('--min-price must be a non-negative number.')
      }
      if (maxPrice !== undefined && (Number.isNaN(maxPrice) || maxPrice < 0)) {
        throw new UsageError('--max-price must be a non-negative number.')
      }
      if (minRating !== undefined && (Number.isNaN(minRating) || minRating < 0 || minRating > 5)) {
        throw new UsageError('--min-rating must be between 0 and 5.')
      }

      hotels = filterByPrice(hotels, { minPrice, maxPrice })
      hotels = filterByRating(hotels, { minRating })

      if (totalBeforeFilter > 0 && hotels.length < totalBeforeFilter) {
        logVerbose(ctx, `Filtered: ${hotels.length} of ${totalBeforeFilter} hotels match criteria`)
      }

      const hasFilters = minPrice !== undefined || maxPrice !== undefined || minRating !== undefined
      const allFilteredOut = hasFilters && totalBeforeFilter > 0 && hotels.length === 0

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
      if (allFilteredOut) {
        if (ctx.output.format === 'json') {
          output(JSON.stringify(result, null, 2))
        } else {
          output('No hotels match your filters.')
        }
      } else if (ctx.output.format === 'json') {
        output(JSON.stringify(result, null, 2))
      } else if (ctx.output.format === 'table') {
        output(formatTableOutput(result))
      } else {
        output(formatPlainOutput(result))
      }
    })
}
