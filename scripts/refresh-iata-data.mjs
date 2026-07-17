#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const REPOSITORY = 'lxndrblz/Airports'
const BRANCH = 'main'
const SOURCE_FILE = 'src/lib/iata.ts'
const MINIMUM_AIRPORTS = 1_000

export function parseCsvLine(line) {
  const fields = []
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

function requireCleanWorktree() {
  const status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
  if (status) {
    throw new Error('The working tree must be clean before refreshing the airport dataset.')
  }
}

async function fetchOrThrow(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status} ${response.statusText}): ${url}`)
  }
  return response
}

export function validateDataset(csv, minimumAirports = MINIMUM_AIRPORTS) {
  const lines = csv.split(/\r?\n/)
  const columns = parseCsvLine(lines[0] ?? '').map((column) =>
    column.trim().replace(/^\uFEFF/, '').toLowerCase(),
  )
  const codeIndex = columns.findIndex((column) => column === 'iata' || column === 'code')
  const cityIndex = columns.findIndex((column) => column === 'city')

  if (codeIndex === -1 || cityIndex === -1) {
    throw new Error('Dataset must contain an IATA/code column and a city column.')
  }

  const mapping = new Map()
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const fields = parseCsvLine(line)
    const code = fields[codeIndex]?.trim()
    const city = fields[cityIndex]?.trim()
    if (code && city && /^[A-Z]{3}$/.test(code)) mapping.set(code, city)
  }

  if (mapping.size < minimumAirports) {
    throw new Error(
      `Dataset yielded ${mapping.size} airport mappings; expected at least ${minimumAirports}.`,
    )
  }

  return { codeColumn: columns[codeIndex], airportCount: mapping.size, mapping }
}

export function summarizeDatasetChanges(previous, next) {
  let added = 0
  let removed = 0
  let cityChanged = 0

  for (const [code, city] of next.mapping) {
    if (!previous.mapping.has(code)) added++
    else if (previous.mapping.get(code) !== city) cityChanged++
  }
  for (const code of previous.mapping.keys()) {
    if (!next.mapping.has(code)) removed++
  }

  return { added, removed, cityChanged }
}

async function main() {
  requireCleanWorktree()

  const headers = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const commitResponse = await fetchOrThrow(
    `https://api.github.com/repos/${REPOSITORY}/commits/${BRANCH}`,
    { headers },
  )
  const { sha } = await commitResponse.json()
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Upstream returned an invalid commit SHA.')

  const csvResponse = await fetchOrThrow(
    `https://raw.githubusercontent.com/${REPOSITORY}/${sha}/airports.csv`,
  )
  const csv = await csvResponse.text()
  const { codeColumn, airportCount } = validateDataset(csv)

  const source = await readFile(SOURCE_FILE, 'utf8')
  const revisionPattern = /(export const AIRPORTS_DATA_REVISION = )'([a-f0-9]{40})'/
  const match = source.match(revisionPattern)
  if (!match) throw new Error(`Could not find AIRPORTS_DATA_REVISION in ${SOURCE_FILE}.`)

  const previousRevision = match[2]
  if (previousRevision === sha) {
    console.log(`Airport dataset is already pinned to ${sha} (${airportCount} mappings).`)
  } else {
    const previousResponse = await fetchOrThrow(
      `https://raw.githubusercontent.com/${REPOSITORY}/${previousRevision}/airports.csv`,
    )
    const previousDataset = validateDataset(await previousResponse.text())
    const changes = summarizeDatasetChanges(previousDataset, validateDataset(csv))

    await writeFile(SOURCE_FILE, source.replace(revisionPattern, `$1'${sha}'`))
    console.log(`Updated airport dataset revision: ${previousRevision} → ${sha}`)
    console.log(`Validated ${airportCount} airport mappings using the "${codeColumn}" column.`)
    console.log(
      `Dataset comparison: ${changes.added} added, ${changes.removed} removed, ${changes.cityChanged} city names changed.`,
    )
    console.log(`Upstream diff: https://github.com/${REPOSITORY}/compare/${previousRevision}...${sha}`)
  }

  console.log(`\nNext steps:\n  1. Review the revision, mapping summary, and upstream diff above.\n  2. Run: pnpm run verify\n  3. Commit the revision update on a dedicated branch and open a PR for review.\n\nWatch for upstream schema changes, unexpectedly low mapping counts, and city-name changes that could alter search locations.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`IATA dataset refresh failed: ${error.message}`)
    process.exitCode = 1
  })
}
