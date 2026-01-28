import { describe, expect, it } from 'vitest'
import type { Hotel, SearchResult } from '../../src/lib/types.js'
import { formatTableOutput, formatTableRow } from '../../src/lib/table.js'

function makeHotel(overrides: Partial<Hotel> = {}): Hotel {
  return {
    name: 'Test Hotel',
    price: 100,
    currency: 'USD',
    rating: 4.0,
    amenities: [],
    url: null,
    ...overrides,
  }
}

function makeResult(hotels: Hotel[], currency = 'USD'): SearchResult {
  const prices = hotels.map((h) => h.price).filter((p): p is number => p !== null)
  return {
    query: {
      location: 'Tokyo',
      checkin: '2026-03-01',
      checkout: '2026-03-05',
      adults: 2,
      children: 0,
      currency,
    },
    hotels,
    summary: {
      total: hotels.length,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
      highestPrice: prices.length > 0 ? Math.max(...prices) : null,
    },
  }
}

describe('formatTableRow', () => {
  it('formats a basic hotel row', () => {
    const hotel = makeHotel({ name: 'Grand Hyatt', price: 250, rating: 4.5 })
    const row = formatTableRow(hotel, 'USD')
    expect(row).toContain('Grand Hyatt')
    expect(row).toContain('$250')
    expect(row).toContain('4.5')
  })

  it('shows N/A for null price', () => {
    const hotel = makeHotel({ price: null })
    const row = formatTableRow(hotel, 'USD')
    expect(row).toContain('N/A')
  })

  it('shows - for null rating', () => {
    const hotel = makeHotel({ rating: null })
    const row = formatTableRow(hotel, 'USD')
    expect(row).toContain('-')
  })

  it('truncates long name with ellipsis', () => {
    const hotel = makeHotel({ name: 'A'.repeat(50) })
    const row = formatTableRow(hotel, 'USD')
    expect(row).toContain('…')
    // Name column is 35 chars, so truncated name should be 34 chars + ellipsis
    const nameSection = row.slice(0, 35)
    expect(nameSection.length).toBe(35)
    expect(nameSection.endsWith('…')).toBe(true)
  })

  it('truncates long amenities with ellipsis', () => {
    const hotel = makeHotel({
      amenities: ['Free Wi-Fi', 'Air conditioning', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'],
    })
    const row = formatTableRow(hotel, 'USD')
    expect(row).toContain('…')
  })

  it('right-aligns price column', () => {
    const hotel = makeHotel({ price: 32 })
    const row = formatTableRow(hotel, 'USD')
    // Price column should be right-aligned within 8 chars
    // After name (35) + 2 spaces, the next 8 chars are price
    const priceSection = row.slice(37, 45)
    expect(priceSection).toBe('     $32')
  })

  it('uses correct currency symbol', () => {
    const hotel = makeHotel({ price: 5000 })
    const row = formatTableRow(hotel, 'JPY')
    expect(row).toContain('¥5000')
  })
})

describe('formatTableOutput', () => {
  it('produces header with column names', () => {
    const result = makeResult([makeHotel()])
    const output = formatTableOutput(result)
    expect(output).toContain('Name')
    expect(output).toContain('Price')
    expect(output).toContain('Rating')
    expect(output).toContain('Amenities')
  })

  it('produces separator line with dashes', () => {
    const result = makeResult([makeHotel()])
    const output = formatTableOutput(result)
    expect(output).toContain('─')
  })

  it('shows location and date header', () => {
    const result = makeResult([makeHotel()])
    const output = formatTableOutput(result)
    expect(output).toContain('Hotels in Tokyo')
  })

  it('shows summary footer', () => {
    const result = makeResult([makeHotel({ price: 100 }), makeHotel({ price: 200 })])
    const output = formatTableOutput(result)
    expect(output).toContain('Found 2 hotels')
    expect(output).toContain('Lowest: $100/night')
  })

  it('handles empty hotel list', () => {
    const result = makeResult([])
    const output = formatTableOutput(result)
    expect(output).toContain('No hotels found.')
  })

  it('handles all null prices in summary', () => {
    const result = makeResult([makeHotel({ price: null }), makeHotel({ price: null })])
    const output = formatTableOutput(result)
    expect(output).toContain('Found 2 hotels')
    expect(output).not.toContain('Lowest')
  })

  it('formats multiple hotels as rows', () => {
    const hotels = [
      makeHotel({ name: 'Hotel A', price: 50, rating: 3.5 }),
      makeHotel({ name: 'Hotel B', price: 200, rating: 4.8 }),
    ]
    const result = makeResult(hotels)
    const output = formatTableOutput(result)
    expect(output).toContain('Hotel A')
    expect(output).toContain('Hotel B')
    expect(output).toContain('$50')
    expect(output).toContain('$200')
  })
})
