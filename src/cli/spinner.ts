/**
 * Spinner utility for async operations.
 *
 * Shows a loading spinner on stderr for TTY users during network requests.
 * Disabled when:
 * - Not a TTY (piped/redirected output)
 * - Verbose mode is active (verbose log lines serve the same purpose)
 * - JSON output format (scripting context)
 *
 * The spinner only appears after a 100ms delay to avoid flicker for fast
 * operations. If the operation completes before 100ms, no spinner is shown.
 */

import ora, { type Ora } from 'ora'
import type { CliContext } from './context.js'

const SPINNER_DELAY_MS = 100

function shouldShowSpinner(ctx: CliContext): boolean {
  if (!ctx.isTty) return false
  if (ctx.output.verbose) return false
  if (ctx.output.format === 'json') return false
  return true
}

/**
 * Execute an async operation with a spinner on stderr.
 *
 * @example
 * const html = await withSpinner(ctx, 'Searching hotels', () => fetchHotelsHtml(query))
 */
export async function withSpinner<T>(
  ctx: CliContext,
  message: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (!shouldShowSpinner(ctx)) {
    return operation()
  }

  const state: { spinner: Ora | null; started: boolean } = {
    spinner: null,
    started: false,
  }

  const timeoutId = setTimeout(() => {
    state.spinner = ora({
      text: `${message}...`,
      stream: process.stderr,
    }).start()
    state.started = true
  }, SPINNER_DELAY_MS)

  try {
    const result = await operation()
    clearTimeout(timeoutId)
    if (state.started && state.spinner) {
      state.spinner.stop()
    }
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    if (state.started && state.spinner) {
      state.spinner.stop()
    }
    throw error
  }
}
