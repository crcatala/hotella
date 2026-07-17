import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

// Pinned to an immutable upstream commit so a changed branch cannot alter runtime data.
export const AIRPORTS_DATA_REVISION = 'd1907e811e38a141a3ccace73527248a19ba11af'
const CSV_URL = `https://raw.githubusercontent.com/lxndrblz/Airports/${AIRPORTS_DATA_REVISION}/airports.csv`
const CACHE_DIR = join(homedir(), '.cache', 'hotella')
// Keep caches scoped to the immutable source revision. This intentionally ignores
// the legacy airports.csv cache, which may have been downloaded from main.
const CACHE_FILE = join(CACHE_DIR, `airports-${AIRPORTS_DATA_REVISION}.csv`)
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Override map for common airports where the CSV city column has suburbs
 * instead of metro area names. Maps IATA code → display city name.
 */
const CITY_OVERRIDES: Record<string, string> = {
  JFK: 'New York',
  LGA: 'New York',
  EWR: 'New York',
  LAX: 'Los Angeles',
  SFO: 'San Francisco',
  ORD: 'Chicago',
  MDW: 'Chicago',
  DFW: 'Dallas',
  IAH: 'Houston',
  HOU: 'Houston',
  ATL: 'Atlanta',
  MIA: 'Miami',
  FLL: 'Fort Lauderdale',
  SEA: 'Seattle',
  DCA: 'Washington',
  IAD: 'Washington',
  BWI: 'Baltimore',
  BOS: 'Boston',
  DEN: 'Denver',
  PHX: 'Phoenix',
  LAS: 'Las Vegas',
  MSP: 'Minneapolis',
  DTW: 'Detroit',
  PHL: 'Philadelphia',
  CLT: 'Charlotte',
  SAN: 'San Diego',
  TPA: 'Tampa',
  PDX: 'Portland',
  SLC: 'Salt Lake City',
  STL: 'St. Louis',
  BNA: 'Nashville',
  AUS: 'Austin',
  RDU: 'Raleigh',
  NRT: 'Tokyo',
  HND: 'Tokyo',
  CDG: 'Paris',
  ORY: 'Paris',
  LHR: 'London',
  LGW: 'London',
  STN: 'London',
  LTN: 'London',
  FCO: 'Rome',
  CIA: 'Rome',
  AMS: 'Amsterdam',
  FRA: 'Frankfurt',
  MUC: 'Munich',
  BCN: 'Barcelona',
  MAD: 'Madrid',
  IST: 'Istanbul',
  ICN: 'Seoul',
  GMP: 'Seoul',
  PEK: 'Beijing',
  PKX: 'Beijing',
  PVG: 'Shanghai',
  SHA: 'Shanghai',
  TPE: 'Taipei',
  TSA: 'Taipei',
  BKK: 'Bangkok',
  DMK: 'Bangkok',
  SIN: 'Singapore',
  KUL: 'Kuala Lumpur',
  HKG: 'Hong Kong',
  DEL: 'Delhi',
  BOM: 'Mumbai',
  SYD: 'Sydney',
  MEL: 'Melbourne',
  DXB: 'Dubai',
  DOH: 'Doha',
  GRU: 'São Paulo',
  MEX: 'Mexico City',
  YYZ: 'Toronto',
  YVR: 'Vancouver',
  YUL: 'Montreal',
}

/**
 * Fallback list of ~50 common airports for offline use.
 * Used when the CSV cannot be fetched and no cache exists.
 */
export const FALLBACK_AIRPORTS: Record<string, string> = { ...CITY_OVERRIDES }

/**
 * Determines if input looks like an IATA airport code:
 * exactly 3 uppercase ASCII letters.
 */
export function isIataCode(input: string): boolean {
  return /^[A-Z]{3}$/.test(input)
}

function isCacheValid(): boolean {
  if (!existsSync(CACHE_FILE)) return false
  try {
    const stat = statSync(CACHE_FILE)
    return Date.now() - stat.mtimeMs < CACHE_TTL_MS
  } catch {
    return false
  }
}

/**
 * Parse the airports CSV and build an IATA → city mapping.
 * Applies CITY_OVERRIDES for known metro areas.
 */
export function parseAirportsCsv(csv: string): Record<string, string> {
  const lines = csv.split('\n')
  if (lines.length < 2) return {}

  const header = lines[0]
  // Parse header to find column indices
  const cols = parseCsvLine(header)
  // The pinned source calls its IATA column "code"; accept the conventional
  // "iata" name too for compatible source snapshots and cached data.
  const iataIdx = cols.findIndex((c) => ['iata', 'code'].includes(c.toLowerCase()))
  const cityIdx = cols.findIndex((c) => c.toLowerCase() === 'city')

  if (iataIdx === -1 || cityIdx === -1) return {}

  const mapping: Record<string, string> = {}

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const fields = parseCsvLine(line)
    const iata = fields[iataIdx]?.trim()
    const city = fields[cityIdx]?.trim()
    if (iata && city && isIataCode(iata)) {
      // Apply override if available, otherwise use CSV city
      mapping[iata] = CITY_OVERRIDES[iata] ?? city
    }
  }

  return mapping
}

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

/**
 * Fetch the airports CSV, using cache if valid.
 * Returns the parsed IATA → city mapping, or falls back to bundled list.
 */
export async function loadAirportMapping(): Promise<Record<string, string>> {
  // Check cache first
  if (isCacheValid()) {
    try {
      const csv = readFileSync(CACHE_FILE, 'utf-8')
      const mapping = parseAirportsCsv(csv)
      if (Object.keys(mapping).length > 0) return mapping
    } catch {
      // Cache read failed, continue to fetch
    }
  }

  // Try to fetch fresh CSV
  try {
    const response = await fetch(CSV_URL)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const csv = await response.text()

    // Cache it
    try {
      mkdirSync(dirname(CACHE_FILE), { recursive: true })
      writeFileSync(CACHE_FILE, csv, 'utf-8')
    } catch {
      // Cache write failed — non-fatal
    }

    const mapping = parseAirportsCsv(csv)
    if (Object.keys(mapping).length > 0) return mapping
  } catch {
    // Fetch failed — try stale cache
    if (existsSync(CACHE_FILE)) {
      try {
        const csv = readFileSync(CACHE_FILE, 'utf-8')
        const mapping = parseAirportsCsv(csv)
        if (Object.keys(mapping).length > 0) return mapping
      } catch {
        // Stale cache also failed
      }
    }
  }

  // Ultimate fallback: bundled list
  return { ...FALLBACK_AIRPORTS }
}

/**
 * Resolves a location input. If it looks like an IATA code (3 uppercase letters),
 * attempts to resolve it to a city name. Otherwise returns the input unchanged.
 */
export async function resolveLocation(input: string): Promise<{
  resolved: string
  wasIata: boolean
  original: string
}> {
  const trimmed = input.trim()
  const upper = trimmed.toUpperCase()

  if (!isIataCode(upper)) {
    return { resolved: trimmed, wasIata: false, original: trimmed }
  }

  const mapping = await loadAirportMapping()
  const city = mapping[upper]

  if (city) {
    return { resolved: city, wasIata: true, original: upper }
  }

  // Code not found — pass through unchanged
  return { resolved: trimmed, wasIata: false, original: trimmed }
}
