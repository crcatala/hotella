import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: process.env.HOTELLA_LIVE_TEST ? [] : ['tests/live/**'],
    testTimeout: 10_000,
  },
})

/**
 * Live tests (tests/live/) are excluded from the default vitest run above.
 * They are gated behind HOTELLA_LIVE_TEST=1 via describe.skipIf() and can
 * be run explicitly with: pnpm run test:live:verbose
 */
