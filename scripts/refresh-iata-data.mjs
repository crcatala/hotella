#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'

const REPOSITORY = 'lxndrblz/Airports'
const BRANCH = 'main'
const SOURCE_FILE = 'src/lib/iata.ts'
const MINIMUM_AIRPORTS = 1_000

function parseCsvLine(line) {
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

function validateDataset(csv) {
  const lines = csv.split(/\r?\n/)
  const columns = parseCsvLine(lines[0] ?? '').map((column) => column.trim().toLowerCase())
  const codeIndex = columns.findIndex((column) => column === 'iata' || column === 'code')
  const cityIndex = columns.findIndex((column) => column === 'city')

  if (codeIndex === -1 || cityIndex === -1) {
    throw new Error('Dataset must contain an IATA/code column and a city column.')
  }

  const codes = new Set()
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const fields = parseCsvLine(line)
    const code = fields[codeIndex]?.trim()
    const city = fields[cityIndex]?.trim()
    if (code && city && /^[A-Z]{3}$/.test(code)) codes.add(code)
  }

  if (codes.size < MINIMUM_AIRPORTS) {
    throw new Error(
      `Dataset yielded ${codes.size} airport mappings; expected at least ${MINIMUM_AIRPORTS}.`,
    )
  }

  return { codeColumn: columns[codeIndex], airportCount: codes.size }
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
    await writeFile(SOURCE_FILE, source.replace(revisionPattern, `$1'${sha}'`))
    console.log(`Updated airport dataset revision: ${previousRevision} → ${sha}`)
    console.log(`Validated ${airportCount} airport mappings using the "${codeColumn}" column.`)
  }

  console.log(`\nNext steps:\n  1. Review the diff, especially the pinned revision and dataset mapping count.\n  2. Run: pnpm run verify\n  3. Commit the revision update on a dedicated branch and open a PR for review.\n\nWatch for upstream schema changes, unexpectedly low mapping counts, and city-name changes that could alter search locations.`)
}

main().catch((error) => {
  console.error(`IATA dataset refresh failed: ${error.message}`)
  process.exitCode = 1
})
