import { CURRENCY_SYMBOLS } from './parser.js'
import type { Hotel, SearchResult } from './types.js'

const COL_NAME = 35
const COL_PRICE = 8
const COL_RATING = 6
const COL_AMENITIES = 30

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return `${str.slice(0, maxLen - 1)}…`
}

function padRight(str: string, len: number): string {
  return str.padEnd(len)
}

function padLeft(str: string, len: number): string {
  return str.padStart(len)
}

export function formatTableRow(hotel: Hotel, currency: string): string {
  const name = padRight(truncate(hotel.name, COL_NAME), COL_NAME)

  const sym = CURRENCY_SYMBOLS[currency] ?? `${currency} `
  const priceStr =
    hotel.price !== null ? padLeft(`${sym}${hotel.price}`, COL_PRICE) : padLeft('N/A', COL_PRICE)

  const ratingStr =
    hotel.rating !== null
      ? padRight(hotel.rating.toString(), COL_RATING)
      : padRight('-', COL_RATING)

  const amenityStr = truncate(
    hotel.amenities.length > 0 ? hotel.amenities.join(', ') : '',
    COL_AMENITIES,
  )

  return `${name}  ${priceStr}  ${ratingStr}  ${amenityStr}`
}

export function formatTableOutput(result: SearchResult): string {
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

  // Header
  const header = `${padRight('Name', COL_NAME)}  ${padLeft('Price', COL_PRICE)}  ${padRight('Rating', COL_RATING)}  Amenities`
  lines.push(header)
  lines.push(
    `${'─'.repeat(COL_NAME)}  ${'─'.repeat(COL_PRICE)}  ${'─'.repeat(COL_RATING)}  ${'─'.repeat(COL_AMENITIES)}`,
  )

  for (const hotel of hotels) {
    lines.push(formatTableRow(hotel, query.currency))
  }

  lines.push('')
  if (summary.lowestPrice !== null) {
    const sym = CURRENCY_SYMBOLS[query.currency] ?? `${query.currency} `
    lines.push(`Found ${summary.total} hotels · Lowest: ${sym}${summary.lowestPrice}/night`)
  } else {
    lines.push(`Found ${summary.total} hotels`)
  }

  return lines.join('\n')
}
