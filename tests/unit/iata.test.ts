import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AIRPORTS_DATA_REVISION,
  FALLBACK_AIRPORTS,
  isIataCode,
  parseAirportsCsv,
  resolveLocation,
} from '../../src/lib/iata.js'

const CACHE_DIR = join(homedir(), '.cache', 'hotella')
const CACHE_FILE = join(CACHE_DIR, `airports-${AIRPORTS_DATA_REVISION}.csv`)
const LEGACY_CACHE_FILE = join(CACHE_DIR, 'airports.csv')

describe('isIataCode', () => {
  it('returns true for 3 uppercase letters', () => {
    expect(isIataCode('NRT')).toBe(true)
    expect(isIataCode('CDG')).toBe(true)
    expect(isIataCode('LAX')).toBe(true)
  })

  it('returns false for lowercase', () => {
    expect(isIataCode('nrt')).toBe(false)
    expect(isIataCode('Nrt')).toBe(false)
  })

  it('returns false for wrong length', () => {
    expect(isIataCode('NR')).toBe(false)
    expect(isIataCode('NRTA')).toBe(false)
    expect(isIataCode('')).toBe(false)
  })

  it('returns false for non-alpha characters', () => {
    expect(isIataCode('N1T')).toBe(false)
    expect(isIataCode('NR-')).toBe(false)
  })

  it('returns false for multi-word strings', () => {
    expect(isIataCode('New York')).toBe(false)
    expect(isIataCode('San Francisco')).toBe(false)
  })
})

describe('parseAirportsCsv', () => {
  const sampleCsv = [
    'icao,iata,name,city,subd,country,elevation,lat,lon,tz,lid',
    'RJAA,NRT,"Narita International Airport","Narita","Chiba","JP",135,35.764702,140.386002,Asia/Tokyo,',
    'RCTP,TPE,"Taiwan Taoyuan International Airport","Taoyuan City","Taoyuan","TW",106,25.0777,121.233002,Asia/Taipei,',
    'LFPG,CDG,"Charles de Gaulle International Airport","Roissy-en-France","Île-de-France","FR",119,49.012798,2.55,Europe/Paris,',
    'KJFK,JFK,"John F Kennedy International Airport","Inwood","New York","US",13,40.639801,-73.7789,America/New_York,JFK',
  ].join('\n')

  it('parses CSV into IATA to city mapping', () => {
    const mapping = parseAirportsCsv(sampleCsv)
    expect(mapping.TPE).toBe('Taipei') // Override applied
    expect(mapping.NRT).toBe('Tokyo') // Override applied
  })

  it('applies city overrides for known airports', () => {
    const mapping = parseAirportsCsv(sampleCsv)
    expect(mapping.JFK).toBe('New York') // CSV has "Inwood", override to "New York"
    expect(mapping.CDG).toBe('Paris') // CSV has "Roissy-en-France", override to "Paris"
  })

  it('returns empty object for empty CSV', () => {
    expect(parseAirportsCsv('')).toEqual({})
  })

  it('returns empty object for CSV without required columns', () => {
    expect(parseAirportsCsv('foo,bar\n1,2')).toEqual({})
  })

  it('parses the pinned source schema, where IATA codes are named code', () => {
    const csv = [
      '\uFEFF code ,icao,name,latitude,longitude,elevation,url,time_zone,city_code,country, city ,state,county,type',
      'ABQ,KABQ,Albuquerque International Sunport,35.0402,-106.609,5355,,America/Denver,ABQ,US,Albuquerque,NM,Bernalillo,large_airport',
    ].join('\n')

    expect(parseAirportsCsv(csv)).toMatchObject({ ABQ: 'Albuquerque' })
  })

  it('skips lines without valid IATA codes', () => {
    const csv = 'iata,city\n,SomeCity\n12,OtherCity\nABC,ValidCity'
    const mapping = parseAirportsCsv(csv)
    expect(Object.keys(mapping)).toEqual(['ABC'])
  })
})

describe('FALLBACK_AIRPORTS', () => {
  it('contains common airports', () => {
    expect(FALLBACK_AIRPORTS.NRT).toBe('Tokyo')
    expect(FALLBACK_AIRPORTS.CDG).toBe('Paris')
    expect(FALLBACK_AIRPORTS.JFK).toBe('New York')
    expect(FALLBACK_AIRPORTS.LAX).toBe('Los Angeles')
    expect(FALLBACK_AIRPORTS.LHR).toBe('London')
    expect(FALLBACK_AIRPORTS.TPE).toBe('Taipei')
  })

  it('has at least 50 entries', () => {
    expect(Object.keys(FALLBACK_AIRPORTS).length).toBeGreaterThanOrEqual(50)
  })
})

describe('resolveLocation', () => {
  const cachedContent = new Map<string, string | null>()

  const mockCsv = [
    'code,icao,name,latitude,longitude,elevation,url,time_zone,city_code,country,city,state,county,type',
    'NRT,RJAA,Narita International Airport,35.764702,140.386002,135,,Asia/Tokyo,NRT,JP,Narita,Chiba,,large_airport',
    'TPE,RCTP,Taiwan Taoyuan International Airport,25.0777,121.233002,106,,Asia/Taipei,TPE,TW,Taoyuan City,Taoyuan,,large_airport',
    'CDG,LFPG,Charles de Gaulle International Airport,49.012798,2.55,119,,Europe/Paris,CDG,FR,Roissy-en-France,Île-de-France,,large_airport',
    'ABQ,KABQ,Albuquerque International Sunport,35.0402,-106.609,5355,,America/Denver,ABQ,US,Albuquerque,NM,Bernalillo,large_airport',
  ].join('\n')

  beforeEach(() => {
    for (const cacheFile of [CACHE_FILE, LEGACY_CACHE_FILE]) {
      cachedContent.set(cacheFile, existsSync(cacheFile) ? readFileSync(cacheFile, 'utf-8') : null)
      rmSync(cacheFile, { force: true })
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCsv),
      }),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    for (const cacheFile of [CACHE_FILE, LEGACY_CACHE_FILE]) {
      rmSync(cacheFile, { force: true })
      const content = cachedContent.get(cacheFile)
      if (content !== null && content !== undefined) {
        mkdirSync(dirname(cacheFile), { recursive: true })
        writeFileSync(cacheFile, content, 'utf-8')
      }
    }
    cachedContent.clear()
  })

  it('resolves IATA code to city name', async () => {
    const result = await resolveLocation('NRT')
    expect(result.resolved).toBe('Tokyo')
    expect(result.wasIata).toBe(true)
    expect(result.original).toBe('NRT')
  })

  it('resolves lowercase IATA code (uppercased internally)', async () => {
    const result = await resolveLocation('nrt')
    expect(result.resolved).toBe('Tokyo')
    expect(result.wasIata).toBe(true)
  })

  it('passes through city names unchanged', async () => {
    const result = await resolveLocation('Tokyo')
    expect(result.resolved).toBe('Tokyo')
    expect(result.wasIata).toBe(false)
  })

  it('passes through multi-word locations unchanged', async () => {
    const result = await resolveLocation('New York')
    expect(result.resolved).toBe('New York')
    expect(result.wasIata).toBe(false)
  })

  it('passes through unknown 3-letter code unchanged', async () => {
    const result = await resolveLocation('ZZZ')
    expect(result.resolved).toBe('ZZZ')
    expect(result.wasIata).toBe(false)
  })

  it('ignores a legacy cache downloaded from the mutable source', async () => {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(LEGACY_CACHE_FILE, 'iata,city\nABQ,Incorrect legacy value', 'utf-8')

    const result = await resolveLocation('ABQ')

    expect(fetch).toHaveBeenCalledOnce()
    expect(result.resolved).toBe('Albuquerque')
    expect(result.wasIata).toBe(true)
  })

  it('uses fallback when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await resolveLocation('JFK')
    expect(result.resolved).toBe('New York')
    expect(result.wasIata).toBe(true)
  })

  it('trims whitespace from input', async () => {
    const result = await resolveLocation('  TPE  ')
    expect(result.resolved).toBe('Taipei')
    expect(result.wasIata).toBe(true)
  })
})
