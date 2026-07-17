import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  refreshIataData,
  summarizeDatasetChanges,
  validateDataset,
} from '../../scripts/refresh-iata-data.mjs'

const temporaryDirectories: string[] = []

async function createSource(revision: string) {
  const directory = await mkdtemp(join(tmpdir(), 'hotella-iata-refresh-'))
  temporaryDirectories.push(directory)
  const sourceFile = join(directory, 'iata.ts')
  await writeFile(sourceFile, `export const AIRPORTS_DATA_REVISION = '${revision}'\n`)
  return sourceFile
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('IATA dataset refresh validation', () => {
  it('accepts the runtime parser-compatible code schema with a BOM and whitespace', () => {
    const dataset = ['\uFEFF code , city ', 'ABQ,Albuquerque', 'NRT,Narita'].join('\n')

    const result = validateDataset(dataset, 1)

    expect(result.codeColumn).toBe('code')
    expect(result.mapping).toEqual(
      new Map([
        ['ABQ', 'Albuquerque'],
        ['NRT', 'Narita'],
      ]),
    )
  })

  it('summarizes additions, removals, and city-name changes for PR review', () => {
    const previous = validateDataset('code,city\nAAA,Old City\nBBB,Removed City', 1)
    const next = validateDataset('code,city\nAAA,New City\nCCC,Added City', 1)

    expect(summarizeDatasetChanges(previous, next)).toEqual({
      added: 1,
      removed: 1,
      cityChanged: 1,
    })
  })

  it('rejects a dirty worktree before making network requests', async () => {
    const fetchFn = vi.fn()

    await expect(
      refreshIataData({ getWorktreeStatus: () => ' M src/lib/iata.ts', fetchFn }),
    ).rejects.toThrow('working tree must be clean')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('updates the source revision after validating the new and previous datasets', async () => {
    const previousRevision = 'b'.repeat(40)
    const nextRevision = 'a'.repeat(40)
    const sourceFile = await createSource(previousRevision)
    const logs: string[] = []
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes('/commits/main'))
        return { ok: true, json: async () => ({ sha: nextRevision }) }
      if (url.includes(nextRevision))
        return { ok: true, text: async () => 'code,city\nAAA,New City\nBBB,Added City' }
      return { ok: true, text: async () => 'code,city\nAAA,Old City' }
    })

    await refreshIataData({
      fetchFn,
      getWorktreeStatus: () => '',
      log: (message) => logs.push(message),
      minimumAirports: 1,
      sourceFile,
    })

    await expect(readFile(sourceFile, 'utf8')).resolves.toContain(nextRevision)
    expect(logs.join('\n')).toContain('1 added, 0 removed, 1 city names changed')
  })

  it('does not write when the resolved revision is already pinned', async () => {
    const revision = 'a'.repeat(40)
    const sourceFile = await createSource(revision)
    const writeFileFn = vi.fn()
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes('/commits/main')) return { ok: true, json: async () => ({ sha: revision }) }
      return { ok: true, text: async () => 'code,city\nAAA,City' }
    })

    await refreshIataData({
      fetchFn,
      getWorktreeStatus: () => '',
      minimumAirports: 1,
      sourceFile,
      writeFileFn,
    })

    expect(writeFileFn).not.toHaveBeenCalled()
  })
})
