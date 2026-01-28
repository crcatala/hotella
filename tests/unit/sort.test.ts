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

  describe('price-asc', () => {
    it('sorts by price ascending with nulls last', () => {
      const sorted = sortHotels(hotels, 'price-asc')
      expect(sorted.map((h) => h.name)).toEqual(['Cheap', 'Mid', 'Pricey', 'No Price'])
    })

    it('places all null prices at end', () => {
      const allNull = [
        makeHotel({ name: 'A', price: null }),
        makeHotel({ name: 'B', price: null }),
        makeHotel({ name: 'C', price: 50 }),
      ]
      const sorted = sortHotels(allNull, 'price-asc')
      expect(sorted[0].name).toBe('C')
    })
  })

  describe('price-desc', () => {
    it('sorts by price descending with nulls last', () => {
      const sorted = sortHotels(hotels, 'price-desc')
      expect(sorted.map((h) => h.name)).toEqual(['Pricey', 'Mid', 'Cheap', 'No Price'])
    })
  })

  describe('rating', () => {
    it('sorts by rating descending with nulls last', () => {
      const sorted = sortHotels(hotels, 'rating')
      expect(sorted.map((h) => h.name)).toEqual(['No Price', 'Mid', 'Pricey', 'Cheap'])
    })

    it('places null ratings last', () => {
      const withNullRating = [
        makeHotel({ name: 'A', rating: null }),
        makeHotel({ name: 'B', rating: 3.0 }),
      ]
      const sorted = sortHotels(withNullRating, 'rating')
      expect(sorted.map((h) => h.name)).toEqual(['B', 'A'])
    })
  })

  describe('value', () => {
    it('sorts by value (rating/price) descending with nulls last', () => {
      const sorted = sortHotels(hotels, 'value')
      // Cheap: 3.5/50=0.07, Mid: 4.5/100=0.045, Pricey: 4.0/200=0.02, No Price: 0
      expect(sorted.map((h) => h.name)).toEqual(['Cheap', 'Mid', 'Pricey', 'No Price'])
    })

    it('places hotels with no price or no rating last', () => {
      const mixed = [
        makeHotel({ name: 'Good', price: 100, rating: 4.0 }),
        makeHotel({ name: 'No Price', price: null, rating: 4.5 }),
        makeHotel({ name: 'No Rating', price: 80, rating: null }),
      ]
      const sorted = sortHotels(mixed, 'value')
      expect(sorted[0].name).toBe('Good')
    })
  })

  describe('edge cases', () => {
    it('handles empty array', () => {
      expect(sortHotels([], 'price-asc')).toEqual([])
    })

    it('handles single item', () => {
      const single = [makeHotel({ name: 'Only' })]
      const sorted = sortHotels(single, 'price-asc')
      expect(sorted).toHaveLength(1)
      expect(sorted[0].name).toBe('Only')
    })

    it('handles all prices null', () => {
      const allNull = [
        makeHotel({ name: 'A', price: null }),
        makeHotel({ name: 'B', price: null }),
        makeHotel({ name: 'C', price: null }),
      ]
      const sorted = sortHotels(allNull, 'price-asc')
      expect(sorted).toHaveLength(3)
    })

    it('handles all ratings null', () => {
      const allNull = [
        makeHotel({ name: 'A', rating: null }),
        makeHotel({ name: 'B', rating: null }),
      ]
      const sorted = sortHotels(allNull, 'rating')
      expect(sorted).toHaveLength(2)
    })

    it('does not mutate original array', () => {
      const original = [makeHotel({ name: 'B', price: 200 }), makeHotel({ name: 'A', price: 50 })]
      const originalCopy = [...original]
      sortHotels(original, 'price-asc')
      expect(original[0].name).toBe(originalCopy[0].name)
      expect(original[1].name).toBe(originalCopy[1].name)
    })
  })
})
