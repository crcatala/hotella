import type { Hotel } from './types.js'

export interface PriceFilter {
  minPrice?: number
  maxPrice?: number
}

export interface RatingFilter {
  minRating?: number
}

export function filterByPrice(hotels: Hotel[], filter: PriceFilter): Hotel[] {
  const { minPrice, maxPrice } = filter
  if (minPrice === undefined && maxPrice === undefined) return hotels

  return hotels.filter((h) => {
    // Exclude hotels with null price when price filter is active
    if (h.price === null) return false
    if (minPrice !== undefined && h.price < minPrice) return false
    if (maxPrice !== undefined && h.price > maxPrice) return false
    return true
  })
}

export function filterByRating(hotels: Hotel[], filter: RatingFilter): Hotel[] {
  const { minRating } = filter
  if (minRating === undefined) return hotels

  return hotels.filter((h) => {
    // Exclude hotels with null rating when rating filter is active
    if (h.rating === null) return false
    return h.rating >= minRating
  })
}
