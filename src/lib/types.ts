export interface SearchQuery {
  location: string
  checkin: string // YYYY-MM-DD
  checkout: string // YYYY-MM-DD
  adults: number
  children: number
  currency: string
}

export interface Hotel {
  name: string
  price: number | null
  currency: string
  rating: number | null
  amenities: string[]
  url: string | null
}

export interface SearchResult {
  query: SearchQuery
  hotels: Hotel[]
  summary: {
    total: number
    lowestPrice: number | null
    highestPrice: number | null
  }
}
