import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseHotelsHtml } from '../../src/lib/parser.js'
import type { Hotel } from '../../src/lib/types.js'

const FIXTURE_PATH = join(__dirname, '..', 'fixtures', 'google-hotels-cards.html')
const fixtureHtml = readFileSync(FIXTURE_PATH, 'utf-8')

describe('parseHotelsHtml', () => {
  let hotels: Hotel[]

  // Parse once for all tests
  hotels = parseHotelsHtml(fixtureHtml, 'USD')

  it('parses multiple hotel cards from fixture', () => {
    // Fixture has 9 cards, but one has empty name → 8 valid
    expect(hotels.length).toBe(8)
  })

  it('extracts hotel names', () => {
    const names = hotels.map((h) => h.name)
    expect(names).toContain('Grand Hyatt Tokyo')
    expect(names).toContain('Budget Inn Downtown')
    expect(names).toContain('The Ritz-Carlton')
  })

  it('extracts prices correctly', () => {
    const grand = hotels.find((h) => h.name === 'Grand Hyatt Tokyo')!
    expect(grand.price).toBe(250)

    const budget = hotels.find((h) => h.name === 'Budget Inn Downtown')!
    expect(budget.price).toBe(75)

    const aman = hotels.find((h) => h.name === 'Aman Tokyo')!
    expect(aman.price).toBe(1200)
  })

  it('handles missing price gracefully', () => {
    const ritz = hotels.find((h) => h.name === 'The Ritz-Carlton')!
    expect(ritz.price).toBeNull()
  })

  it('extracts ratings', () => {
    const grand = hotels.find((h) => h.name === 'Grand Hyatt Tokyo')!
    expect(grand.rating).toBe(4.5)

    const budget = hotels.find((h) => h.name === 'Budget Inn Downtown')!
    expect(budget.rating).toBe(3.2)
  })

  it('handles missing rating gracefully', () => {
    const sakura = hotels.find((h) => h.name === 'Sakura Hostel')!
    expect(sakura.rating).toBeNull()
  })

  it('extracts rating from aria-label fallback', () => {
    const keio = hotels.find((h) => h.name === 'Keio Plaza Hotel')!
    expect(keio.rating).toBe(4.2)
  })

  it('handles mixed-language names', () => {
    const mixed = hotels.find((h) => h.name === 'ホテル東京ステーション Hotel')
    expect(mixed).toBeDefined()
    expect(mixed!.price).toBe(180)
    expect(mixed!.rating).toBe(4.1)
  })

  it('extracts amenities', () => {
    const grand = hotels.find((h) => h.name === 'Grand Hyatt Tokyo')!
    expect(grand.amenities).toContain('Free Wi-Fi')
    expect(grand.amenities).toContain('Pool')
    expect(grand.amenities).toContain('Spa')
  })

  it('extracts many amenities for well-equipped hotel', () => {
    const park = hotels.find((h) => h.name === 'Park Hotel Meguro')!
    expect(park.amenities.length).toBeGreaterThanOrEqual(6)
    expect(park.amenities).toContain('Gym')
    expect(park.amenities).toContain('Restaurant')
    expect(park.amenities).toContain('Bar')
    expect(park.amenities).toContain('Room service')
  })

  it('extracts URLs', () => {
    const grand = hotels.find((h) => h.name === 'Grand Hyatt Tokyo')!
    expect(grand.url).toBe('https://www.google.com/travel/hotels/entity/abc123')
  })

  it('sets currency on all hotels', () => {
    for (const hotel of hotels) {
      expect(hotel.currency).toBe('USD')
    }
  })

  it('skips cards without names', () => {
    // Card 8 in fixture has empty h2 - should be excluded
    const names = hotels.map((h) => h.name)
    expect(names.every((n) => n.length > 0)).toBe(true)
  })

  it('returns empty array for HTML with no hotel cards', () => {
    const result = parseHotelsHtml('<html><body><p>No hotels here</p></body></html>', 'USD')
    expect(result).toEqual([])
  })

  it('returns empty array for empty HTML', () => {
    const result = parseHotelsHtml('', 'USD')
    expect(result).toEqual([])
  })

  it('parses with different currency', () => {
    // The fixture has $ prices, so EUR parsing will get different results
    const eurHotels = parseHotelsHtml(fixtureHtml, 'EUR')
    expect(eurHotels.length).toBe(8)
    // EUR parser uses fallback for $ symbols
    for (const hotel of eurHotels) {
      expect(hotel.currency).toBe('EUR')
    }
  })
})
