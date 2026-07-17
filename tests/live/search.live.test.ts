import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'
import { fetchHotelsHtml } from '../../src/lib/fetcher.js'
import { parseHotelsHtml } from '../../src/lib/parser.js'
import type { SearchQuery, SearchResult } from '../../src/lib/types.js'

// Only run when HOTELLA_LIVE_TEST=1 is set
const LIVE = process.env.HOTELLA_LIVE_TEST === '1'
const execFileAsync = promisify(execFile)
const PROJECT_DIR = join(__dirname, '..', '..')
const CLI_PATH = join(PROJECT_DIR, 'dist', 'cli.js')

function futureDates(): Pick<SearchQuery, 'checkin' | 'checkout'> {
  const now = new Date()
  const checkin = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const checkout = new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000)
  return {
    checkin: checkin.toISOString().slice(0, 10),
    checkout: checkout.toISOString().slice(0, 10),
  }
}

async function runLiveCli(args: string[]): Promise<SearchResult> {
  const { stdout, stderr } = await execFileAsync('node', [CLI_PATH, ...args], {
    cwd: PROJECT_DIR,
    env: { ...process.env, FORCE_COLOR: undefined, NO_COLOR: '1' },
    timeout: 30_000,
  })
  expect(stderr).toBe('')
  return JSON.parse(stdout) as SearchResult
}

describe.skipIf(!LIVE)('live search', () => {
  beforeAll(async () => {
    await execFileAsync('npx', ['tsgo'], { cwd: PROJECT_DIR, timeout: 30_000 })
  }, 30_000)

  it('fetches and parses real hotel data', { timeout: 30_000 }, async () => {
    // Use dates 30+ days out to avoid availability issues
    const query: SearchQuery = {
      location: 'Tokyo',
      ...futureDates(),
      adults: 2,
      children: 0,
      currency: 'USD',
    }

    const { html } = await fetchHotelsHtml(query)
    expect(html.length).toBeGreaterThan(1000)

    const hotels = parseHotelsHtml(html, 'USD')
    expect(hotels.length).toBeGreaterThan(0)

    // Validate structure of first hotel
    const hotel = hotels[0]
    expect(hotel.name).toBeTruthy()
    expect(typeof hotel.name).toBe('string')
    expect(hotel.currency).toBe('USD')
    expect(hotel.amenities).toBeInstanceOf(Array)

    // Price and rating can be null, but should be correct types
    if (hotel.price !== null) {
      expect(typeof hotel.price).toBe('number')
      expect(hotel.price).toBeGreaterThan(0)
    }
    if (hotel.rating !== null) {
      expect(typeof hotel.rating).toBe('number')
      expect(hotel.rating).toBeGreaterThan(0)
      expect(hotel.rating).toBeLessThanOrEqual(5)
    }
  })

  it('runs a JSON search through the compiled CLI', { timeout: 30_000 }, async () => {
    const dates = futureDates()
    const result = await runLiveCli([
      'search',
      'Tokyo',
      '--checkin',
      dates.checkin,
      '--checkout',
      dates.checkout,
      '--json',
      '--limit',
      '2',
    ])

    expect(result.query).toMatchObject({ location: 'Tokyo', ...dates, currency: 'USD' })
    expect(result.hotels).toHaveLength(2)
    for (const hotel of result.hotels) {
      expect(hotel.name).toBeTruthy()
      expect(hotel.currency).toBe('USD')
      expect(hotel.amenities).toBeInstanceOf(Array)
    }
  })

  it(
    'applies rating filtering and limits results through the CLI',
    { timeout: 30_000 },
    async () => {
      const dates = futureDates()
      const result = await runLiveCli([
        'search',
        'Tokyo',
        '--checkin',
        dates.checkin,
        '--checkout',
        dates.checkout,
        '--json',
        '--min-rating',
        '3',
        '--limit',
        '1',
      ])

      expect(result.hotels).toHaveLength(1)
      expect(result.summary.total).toBe(1)
      expect(result.hotels[0].rating).not.toBeNull()
      expect(result.hotels[0].rating).toBeGreaterThanOrEqual(3)
    },
  )

  it(
    'returns prices in the requested non-default currency through the CLI',
    { timeout: 30_000 },
    async () => {
      const dates = futureDates()
      const result = await runLiveCli([
        'search',
        'Tokyo',
        '--checkin',
        dates.checkin,
        '--checkout',
        dates.checkout,
        '--json',
        '--currency',
        'EUR',
        '--limit',
        '1',
      ])

      expect(result.query.currency).toBe('EUR')
      expect(result.hotels).toHaveLength(1)
      expect(result.hotels[0].currency).toBe('EUR')
      if (result.hotels[0].price !== null) {
        expect(result.hotels[0].price).toBeGreaterThan(0)
      }
    },
  )
})
