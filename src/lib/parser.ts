import * as cheerio from 'cheerio'
import type { Hotel } from './types.js'

/**
 * Currency symbol mapping for plain output display
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  TWD: 'NT$',
}

/**
 * Currency symbol patterns for price extraction.
 *
 * Each currency has specific patterns to handle locale-appropriate formats:
 * - USD: $123 or $1,234
 * - EUR: €123 or 123 € (postfix common in EU locales)
 * - GBP: £123 or £1,234
 * - JPY: ¥12,345 or ¥12345 (no decimals)
 * - TWD: NT$1,234 or TWD 1,234
 */
const CURRENCY_PATTERNS: Record<string, RegExp> = {
  USD: /\$([0-9][0-9.,]*)/,
  EUR: /€\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*€/,
  GBP: /£([0-9][0-9.,]*)/,
  JPY: /¥([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*円/,
  TWD: /NT\$([0-9][0-9.,]*)|TWD\s*([0-9][0-9.,]*)/,
}

// Fallback: match any number that looks like a price
const FALLBACK_PRICE_PATTERN =
  /[\$€£¥]([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:USD|EUR|GBP|JPY|TWD|per night)/i

/**
 * Currencies that use period as thousands separator (and comma for decimals).
 * For these, "1.234" means 1234 and "1.234,56" means 1234.56.
 */
const PERIOD_THOUSANDS_CURRENCIES = new Set(['EUR'])

/**
 * Parse a numeric string into an integer price, handling comma/period separators.
 * - For most currencies: commas are thousands separators (1,234 → 1234)
 * - For EUR: periods can be thousands separators (1.234 → 1234)
 */
function parseNumericPrice(numStr: string, currency: string): number | null {
  if (!numStr) return null

  let cleaned: string

  if (PERIOD_THOUSANDS_CURRENCIES.has(currency)) {
    // European format: 1.234,56 or 1.234
    // If has both period and comma, period is thousands, comma is decimal
    if (numStr.includes('.') && numStr.includes(',')) {
      cleaned = numStr.replace(/\./g, '').replace(',', '.')
    } else if (numStr.includes('.')) {
      // Period only — could be thousands separator (1.234) or decimal (1.5)
      // If digits after period are exactly 3 and there are digits before, it's thousands
      const parts = numStr.split('.')
      if (parts.length === 2 && parts[1].length === 3) {
        cleaned = numStr.replace(/\./g, '')
      } else {
        cleaned = numStr // treat as decimal
      }
    } else {
      cleaned = numStr.replace(/,/g, '.')
    }
  } else {
    // Standard format: commas are thousands separators
    cleaned = numStr.replace(/,/g, '')
  }

  const num = Number.parseFloat(cleaned)
  if (Number.isNaN(num)) return null
  return Math.round(num) // prices are integers (per night)
}

export function extractPrice(text: string, currency: string): number | null {
  const pattern = CURRENCY_PATTERNS[currency] ?? FALLBACK_PRICE_PATTERN
  const match = text.match(pattern)
  if (!match) {
    // Try fallback if specific pattern didn't match
    if (currency in CURRENCY_PATTERNS) {
      const fallbackMatch = text.match(FALLBACK_PRICE_PATTERN)
      if (fallbackMatch) {
        const numStr = fallbackMatch[1] ?? fallbackMatch[2] ?? ''
        return parseNumericPrice(numStr, currency)
      }
    }
    return null
  }

  // Find the first captured group that has a value
  const numStr = match[1] ?? match[2] ?? ''
  return parseNumericPrice(numStr, currency)
}

export function parseHotelsHtml(html: string, currency: string): Hotel[] {
  const $ = cheerio.load(html)
  const hotels: Hotel[] = []

  // Primary selector for hotel cards
  $('div.uaTTDe').each((_i, card) => {
    const $card = $(card)

    // Name
    const name = $card.find('h2.BgYkof').first().text().trim()
    if (!name) return // skip cards without names

    // Rating - try primary selector, then aria-label fallback
    let rating: number | null = null
    const ratingText = $card.find('span.KFi5wf.lA0BZ').first().text().trim()
    if (ratingText) {
      rating = Number.parseFloat(ratingText)
      if (Number.isNaN(rating)) rating = null
    }
    if (rating === null) {
      const ariaLabel = $card.find('span[aria-label*="out of 5"]').first().attr('aria-label')
      if (ariaLabel) {
        const ariaMatch = ariaLabel.match(/([\d.]+)\s*out of\s*5/)
        if (ariaMatch) {
          rating = Number.parseFloat(ariaMatch[1])
          if (Number.isNaN(rating)) rating = null
        }
      }
    }

    // Price
    const cardText = $card.text()
    const price = extractPrice(cardText, currency)

    // Amenities
    const amenities: string[] = []
    $card.find('span.LtjZ2d').each((_i, el) => {
      const text = $(el).text().trim()
      if (text.length > 2 && !amenities.includes(text)) {
        amenities.push(text)
      }
    })

    // URL
    let url: string | null = null
    const href = $card.find('a[href*="/travel/"]').first().attr('href')
    if (href) {
      url = href.startsWith('http') ? href : `https://www.google.com${href}`
    }

    hotels.push({ name, price, currency, rating, amenities, url })
  })

  return hotels
}
