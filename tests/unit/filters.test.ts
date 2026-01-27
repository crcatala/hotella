import { describe, expect, it } from 'vitest'
import { filterByPrice, filterByRating } from '../../src/lib/filters.js'
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

describe('filterByPrice', () => {
  const hotels: Hotel[] = [
    makeHotel({ name: 'Cheap', price: 50 }),
    makeHotel({ name: 'Mid', price: 100 }),
    makeHotel({ name: 'Pricey', price: 200 }),
    makeHotel({ name: 'No Price', price: null }),
  ]

  it('returns all hotels when no filter specified', () => {
    const result = filterByPrice(hotels, {})
    expect(result).toHaveLength(4)
  })

  it('filters by min price only', () => {
    const result = filterByPrice(hotels, { minPrice: 80 })
    expect(result.map((h) => h.name)).toEqual(['Mid', 'Pricey'])
  })

  it('filters by max price only', () => {
    const result = filterByPrice(hotels, { maxPrice: 100 })
    expect(result.map((h) => h.name)).toEqual(['Cheap', 'Mid'])
  })

  it('filters by both min and max price', () => {
    const result = filterByPrice(hotels, { minPrice: 60, maxPrice: 150 })
    expect(result.map((h) => h.name)).toEqual(['Mid'])
  })

  it('excludes hotels with null price when price filter is active', () => {
    const result = filterByPrice(hotels, { minPrice: 0 })
    expect(result.map((h) => h.name)).toEqual(['Cheap', 'Mid', 'Pricey'])
    expect(result.find((h) => h.name === 'No Price')).toBeUndefined()
  })

  it('includes boundary values (min inclusive)', () => {
    const result = filterByPrice(hotels, { minPrice: 50 })
    expect(result.map((h) => h.name)).toContain('Cheap')
  })

  it('includes boundary values (max inclusive)', () => {
    const result = filterByPrice(hotels, { maxPrice: 200 })
    expect(result.map((h) => h.name)).toContain('Pricey')
  })

  it('returns empty array when no hotels match', () => {
    const result = filterByPrice(hotels, { minPrice: 300 })
    expect(result).toHaveLength(0)
  })

  it('handles empty hotel array', () => {
    const result = filterByPrice([], { minPrice: 50 })
    expect(result).toEqual([])
  })
})

describe('filterByRating', () => {
  const hotels: Hotel[] = [
    makeHotel({ name: 'Low', rating: 2.5 }),
    makeHotel({ name: 'Mid', rating: 3.5 }),
    makeHotel({ name: 'High', rating: 4.5 }),
    makeHotel({ name: 'No Rating', rating: null }),
  ]

  it('returns all hotels when no filter specified', () => {
    const result = filterByRating(hotels, {})
    expect(result).toHaveLength(4)
  })

  it('filters by min rating', () => {
    const result = filterByRating(hotels, { minRating: 3.0 })
    expect(result.map((h) => h.name)).toEqual(['Mid', 'High'])
  })

  it('excludes hotels with null rating when rating filter is active', () => {
    const result = filterByRating(hotels, { minRating: 0 })
    expect(result.map((h) => h.name)).toEqual(['Low', 'Mid', 'High'])
    expect(result.find((h) => h.name === 'No Rating')).toBeUndefined()
  })

  it('includes boundary values (min inclusive)', () => {
    const result = filterByRating(hotels, { minRating: 3.5 })
    expect(result.map((h) => h.name)).toContain('Mid')
  })

  it('returns empty array when no hotels match', () => {
    const result = filterByRating(hotels, { minRating: 5.0 })
    expect(result).toHaveLength(0)
  })

  it('handles empty hotel array', () => {
    const result = filterByRating([], { minRating: 3.0 })
    expect(result).toEqual([])
  })
})
