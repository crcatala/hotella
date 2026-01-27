import type { Hotel } from './types.js'

export type SortMode = 'price-asc' | 'price-desc' | 'rating' | 'value'

export function sortHotels(hotels: Hotel[], mode: SortMode): Hotel[] {
  const sorted = [...hotels]

  sorted.sort((a, b) => {
    switch (mode) {
      case 'price-asc': {
        if (a.price === null && b.price === null) return 0
        if (a.price === null) return 1
        if (b.price === null) return -1
        return a.price - b.price
      }
      case 'price-desc': {
        if (a.price === null && b.price === null) return 0
        if (a.price === null) return 1
        if (b.price === null) return -1
        return b.price - a.price
      }
      case 'rating': {
        if (a.rating === null && b.rating === null) return 0
        if (a.rating === null) return 1
        if (b.rating === null) return -1
        return b.rating - a.rating
      }
      case 'value': {
        const aValue = a.rating && a.price ? a.rating / a.price : 0
        const bValue = b.rating && b.price ? b.rating / b.price : 0
        if (aValue === 0 && bValue === 0) return 0
        if (aValue === 0) return 1
        if (bValue === 0) return -1
        return bValue - aValue
      }
    }
  })

  return sorted
}
