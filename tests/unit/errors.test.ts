import { describe, expect, it } from 'vitest'
import { ApiError, UsageError } from '../../src/cli/errors.js'

describe('Error messages', () => {
  describe('UsageError for past dates', () => {
    it('includes the date and actionable suggestion', () => {
      const error = new UsageError('Check-in date 2020-01-01 is in the past. Use a future date.')
      expect(error.message).toBe('Check-in date 2020-01-01 is in the past. Use a future date.')
      expect(error.code).toBe('USAGE_ERROR')
      expect(error.exitCode).toBe(2)
    })
  })

  describe('ApiError for network failures', () => {
    it('provides actionable network error message', () => {
      const error = new ApiError(
        'Failed to connect to Google Hotels. Check your internet connection.',
      )
      expect(error.message).toBe(
        'Failed to connect to Google Hotels. Check your internet connection.',
      )
      expect(error.code).toBe('API_ERROR')
    })
  })

  describe('ApiError for rate limiting', () => {
    it('suggests waiting and retrying', () => {
      const error = new ApiError(
        'Google Hotels is rate-limiting requests. Wait a few minutes and try again.',
        429,
      )
      expect(error.message).toContain('rate-limiting')
      expect(error.message).toContain('Wait')
      expect(error.statusCode).toBe(429)
    })
  })

  describe('ApiError for parse failures', () => {
    it('suggests debug flag', () => {
      const error = new ApiError(
        'Failed to parse hotel data. Google may have changed their page layout. Try --debug for details.',
      )
      expect(error.message).toContain('Failed to parse')
      expect(error.message).toContain('--debug')
    })
  })

  describe('No results message', () => {
    it('includes location and actionable suggestion', () => {
      const msg = 'No hotels found for "Atlantis". Try a different location or broader dates.'
      expect(msg).toContain('Atlantis')
      expect(msg).toContain('Try a different location')
    })
  })

  describe('Error JSON serialization', () => {
    it('ApiError serializes with code and message', () => {
      const error = new ApiError('Network failure', 500, { originalError: 'ENOTFOUND' })
      const json = error.toJSON()
      expect(json.error).toBe(true)
      expect(json.code).toBe('API_ERROR')
      expect(json.message).toBe('Network failure')
      expect(json.details).toEqual({ statusCode: 500, originalError: 'ENOTFOUND' })
    })

    it('UsageError serializes with USAGE_ERROR code', () => {
      const error = new UsageError('Check-in date 2020-01-01 is in the past. Use a future date.')
      const json = error.toJSON()
      expect(json.code).toBe('USAGE_ERROR')
    })
  })
})
