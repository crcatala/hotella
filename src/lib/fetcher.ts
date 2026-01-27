import { ApiError } from '../cli/errors.js'
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

  let response: Awaited<ReturnType<Impit['fetch']>>
  try {
    const client = new Impit({ browser })
    response = await client.fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (
      msg.includes('ENOTFOUND') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('fetch failed') ||
      msg.includes('network')
    ) {
      throw new ApiError(
        'Failed to connect to Google Hotels. Check your internet connection.',
        undefined,
        { originalError: msg },
      )
    }
    throw new ApiError(`Failed to connect to Google Hotels: ${msg}`, undefined, {
      originalError: msg,
    })
  }

  if (response.status === 429) {
    throw new ApiError(
      'Google Hotels is rate-limiting requests. Wait a few minutes and try again.',
      429,
    )
  }

  if (!response.ok) {
    throw new ApiError(
      `Google Hotels returned HTTP ${response.status}. Try again or use --browser firefox.`,
      response.status,
    )
  }

  const html = await response.text()

  if (html.length < 1000) {
    throw new ApiError(
      'Google Hotels may be rate-limiting requests. Wait a few minutes and try again.',
      undefined,
      { htmlLength: html.length },
    )
  }

  return { html, url }
}
