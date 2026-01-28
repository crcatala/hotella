import { describe, expect, it } from 'vitest'
import { fetchHotelsHtml } from '../../src/lib/fetcher.js'
import { parseHotelsHtml } from '../../src/lib/parser.js'
import type { SearchQuery } from '../../src/lib/types.js'

// Only run when HOTELLA_LIVE_TEST=1 is set
const LIVE = process.env.HOTELLA_LIVE_TEST === '1'

describe.skipIf(!LIVE)('live search', () => {
  it(
    'fetches and parses real hotel data',
    async () => {
      // Use dates 30+ days out to avoid availability issues
      const now = new Date()
      const checkin = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const checkout = new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000)

      const query: SearchQuery = {
        location: 'Tokyo',
        checkin: checkin.toISOString().slice(0, 10),
        checkout: checkout.toISOString().slice(0, 10),
        adults: 2,
        children: 0,
        currency: 'USD',
      }

      const { html } = await fetchHotelsHtml(query)
      expect(html.length).toBeGreaterThan(1000)

      const hotels = parseHotelsHtml(html, 'USD')
      expect(hotels.length).toBeGreaterThan(0)

      // Validate structure of first hotel
      const hotel = hotels[0]
      expect(hotel.name).toBeTruthy()
      expect(typeof hotel.name).toBe('string')
      expect(hotel.currency).toBe('USD')
      expect(hotel.amenities).toBeInstanceOf(Array)

      // Price and rating can be null, but should be correct types
      if (hotel.price !== null) {
        expect(typeof hotel.price).toBe('number')
        expect(hotel.price).toBeGreaterThan(0)
      }
      if (hotel.rating !== null) {
        expect(typeof hotel.rating).toBe('number')
        expect(hotel.rating).toBeGreaterThan(0)
        expect(hotel.rating).toBeLessThanOrEqual(5)
      }
    },
    { timeout: 30_000 },
  )
})
