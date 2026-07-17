import { describe, expect, it } from 'vitest'
import {
  summarizeDatasetChanges,
  validateDataset,
} from '../../scripts/refresh-iata-data.mjs'

describe('IATA dataset refresh validation', () => {
  it('accepts the runtime parser-compatible code schema with a BOM and whitespace', () => {
    const dataset = [
      '\uFEFF code , city ',
      'ABQ,Albuquerque',
      'NRT,Narita',
    ].join('\n')

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
})
