import { describe, expect, it } from 'vitest'
import { sortHotels } from '../../src/lib/sort.js'
import type { Hotel } from '../../src/lib/types.js'

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

describe('sortHotels', () => {
  const hotels: Hotel[] = [
    makeHotel({ name: 'Cheap', price: 50, rating: 3.5 }),
    makeHotel({ name: 'Mid', price: 100, rating: 4.5 }),
    makeHotel({ name: 'Pricey', price: 200, rating: 4.0 }),
    makeHotel({ name: 'No Price', price: null, rating: 4.8 }),
  ]

  it('sorts by price ascending with nulls last', () => {
    const sorted = sortHotels(hotels, 'price-asc')
    expect(sorted.map((h) => h.name)).toEqual(['Cheap', 'Mid', 'Pricey', 'No Price'])
  })

  it('sorts by price descending with nulls last', () => {
    const sorted = sortHotels(hotels, 'price-desc')
    expect(sorted.map((h) => h.name)).toEqual(['Pricey', 'Mid', 'Cheap', 'No Price'])
  })

  it('sorts by rating descending with nulls last', () => {
    const sorted = sortHotels(hotels, 'rating')
    expect(sorted.map((h) => h.name)).toEqual(['No Price', 'Mid', 'Pricey', 'Cheap'])
  })

  it('sorts by value (rating/price) descending with nulls last', () => {
    const sorted = sortHotels(hotels, 'value')
    // Cheap: 3.5/50=0.07, Mid: 4.5/100=0.045, Pricey: 4.0/200=0.02, No Price: 0
    expect(sorted.map((h) => h.name)).toEqual(['Cheap', 'Mid', 'Pricey', 'No Price'])
  })

  it('handles empty array', () => {
    expect(sortHotels([], 'price-asc')).toEqual([])
  })

  it('handles single item', () => {
    const single = [makeHotel({ name: 'Only' })]
    expect(sortHotels(single, 'price-asc')).toEqual(single)
  })
})
