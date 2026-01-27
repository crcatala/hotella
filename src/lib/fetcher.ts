import { Impit } from 'impit'
import type { SearchQuery } from './types.js'

function buildSearchUrl(query: SearchQuery): string {
  const city = query.location.trim().toLowerCase().replace(/\s+/g, '+')
  const params = new URLSearchParams({
    q: `hotels in ${query.location}`,
    hl: 'en',
    gl: 'us',
    cs: '1',
    ssta: '1',
    checkin: query.checkin,
    checkout: query.checkout,
    guests: String(query.adults + query.children),
    curr: query.currency,
  })
  return `https://www.google.com/travel/hotels/${city}?${params.toString()}`
}

export async function fetchHotelsHtml(
  query: SearchQuery,
  browser: 'chrome' | 'firefox' = 'chrome',
): Promise<{ html: string; url: string }> {
  const url = buildSearchUrl(query)

  const client = new Impit({ browser })
  const response = await client.fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Google Hotels returned HTTP ${response.status}. Try again or use --browser firefox.`,
    )
  }

  const html = await response.text()

  if (html.length < 1000) {
    throw new Error(
      'Received unexpectedly short response from Google Hotels. You may be rate-limited.',
    )
  }

  return { html, url }
}
