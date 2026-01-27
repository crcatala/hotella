import { describe, expect, it } from 'vitest'
import { CURRENCY_SYMBOLS, extractPrice } from '../../src/lib/parser.js'

describe('extractPrice', () => {
  describe('USD', () => {
    it('extracts simple USD price', () => {
      expect(extractPrice('$123', 'USD')).toBe(123)
    })

    it('extracts USD price with comma thousands separator', () => {
      expect(extractPrice('$1,234', 'USD')).toBe(1234)
    })

    it('extracts USD price from surrounding text', () => {
      expect(extractPrice('Price: $89 per night', 'USD')).toBe(89)
    })

    it('extracts large USD price', () => {
      expect(extractPrice('$12,345', 'USD')).toBe(12345)
    })

    it('returns null for no price text', () => {
      expect(extractPrice('No price available', 'USD')).toBeNull()
    })
  })

  describe('EUR', () => {
    it('extracts EUR price with prefix symbol', () => {
      expect(extractPrice('€123', 'EUR')).toBe(123)
    })

    it('extracts EUR price with postfix symbol', () => {
      expect(extractPrice('123 €', 'EUR')).toBe(123)
    })

    it('extracts EUR price with period thousands separator', () => {
      expect(extractPrice('€1.234', 'EUR')).toBe(1234)
    })

    it('extracts EUR price with period thousands and comma decimal', () => {
      expect(extractPrice('€1.234,56', 'EUR')).toBe(1235)
    })

    it('extracts postfix EUR with thousands separator', () => {
      expect(extractPrice('1.234 €', 'EUR')).toBe(1234)
    })
  })

  describe('GBP', () => {
    it('extracts simple GBP price', () => {
      expect(extractPrice('£99', 'GBP')).toBe(99)
    })

    it('extracts GBP price with comma thousands', () => {
      expect(extractPrice('£1,500', 'GBP')).toBe(1500)
    })

    it('extracts GBP from surrounding text', () => {
      expect(extractPrice('From £250 per night', 'GBP')).toBe(250)
    })
  })

  describe('JPY', () => {
    it('extracts JPY price with yen symbol', () => {
      expect(extractPrice('¥12,345', 'JPY')).toBe(12345)
    })

    it('extracts JPY price without commas', () => {
      expect(extractPrice('¥8500', 'JPY')).toBe(8500)
    })

    it('extracts JPY price with 円 suffix', () => {
      expect(extractPrice('12345 円', 'JPY')).toBe(12345)
    })

    it('extracts large JPY price', () => {
      expect(extractPrice('¥123,456', 'JPY')).toBe(123456)
    })
  })

  describe('TWD', () => {
    it('extracts TWD price with NT$ prefix', () => {
      expect(extractPrice('NT$1,234', 'TWD')).toBe(1234)
    })

    it('extracts TWD price with TWD prefix', () => {
      expect(extractPrice('TWD 2,500', 'TWD')).toBe(2500)
    })

    it('extracts simple TWD price', () => {
      expect(extractPrice('NT$890', 'TWD')).toBe(890)
    })
  })

  describe('fallback', () => {
    it('falls back to generic pattern for known currency with no match', () => {
      // USD pattern won't match €123, but fallback will
      expect(extractPrice('€500', 'USD')).toBe(500)
    })

    it('uses fallback for unknown currency codes', () => {
      expect(extractPrice('$200 per night', 'AUD')).toBe(200)
    })

    it('returns null when no price-like text exists', () => {
      expect(extractPrice('Free breakfast included', 'USD')).toBeNull()
    })
  })
})

describe('CURRENCY_SYMBOLS', () => {
  it('has symbols for all supported currencies', () => {
    expect(CURRENCY_SYMBOLS.USD).toBe('$')
    expect(CURRENCY_SYMBOLS.EUR).toBe('€')
    expect(CURRENCY_SYMBOLS.GBP).toBe('£')
    expect(CURRENCY_SYMBOLS.JPY).toBe('¥')
    expect(CURRENCY_SYMBOLS.TWD).toBe('NT$')
  })
})
