import * as cheerio from 'cheerio'
import type { Hotel } from './types.js'

/**
 * Currency symbol patterns for price extraction
 */
const CURRENCY_PATTERNS: Record<string, RegExp> = {
  USD: /\$([0-9,]+)/,
  EUR: /€([0-9,]+)|([0-9,]+)\s*€/,
  GBP: /£([0-9,]+)/,
  JPY: /¥([0-9,]+)|([0-9,]+)\s*円/,
  TWD: /NT\$([0-9,]+)|TWD\s*([0-9,]+)/,
}

// Fallback: match any number that looks like a price
const FALLBACK_PRICE_PATTERN = /[\$€£¥]([0-9,]+)|([0-9,]+)\s*(?:USD|EUR|GBP|JPY|TWD|per night)/i

function extractPrice(text: string, currency: string): number | null {
  const pattern = CURRENCY_PATTERNS[currency] ?? FALLBACK_PRICE_PATTERN
  const match = text.match(pattern)
  if (!match) {
    // Try fallback if specific pattern didn't match
    if (currency in CURRENCY_PATTERNS) {
      const fallbackMatch = text.match(FALLBACK_PRICE_PATTERN)
      if (fallbackMatch) {
        const numStr = (fallbackMatch[1] ?? fallbackMatch[2] ?? '').replace(/,/g, '')
        const num = Number.parseInt(numStr, 10)
        return Number.isNaN(num) ? null : num
      }
    }
    return null
  }

  // Find the first captured group that has a value
  const numStr = (match[1] ?? match[2] ?? '').replace(/,/g, '')
  const num = Number.parseInt(numStr, 10)
  return Number.isNaN(num) ? null : num
}

export function parseHotelsHtml(html: string, currency: string): Hotel[] {
  const $ = cheerio.load(html)
  const hotels: Hotel[] = []

  // Primary selector for hotel cards
  $('div.uaTTDe').each((_: number, card: cheerio.Element) => {
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
    $card.find('span.LtjZ2d').each((_: number, el: cheerio.Element) => {
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
