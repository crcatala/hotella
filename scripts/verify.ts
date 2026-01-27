#!/usr/bin/env npx tsx
/**
 * verify.ts - Run all verification checks in parallel with nice output
 *
 * Uses tasuku for beautiful task display with spinners when running in a TTY.
 * Falls back to simple output when captured (e.g., by AI agents) to save tokens.
 *
 * Usage:
 *   npx tsx scripts/verify.ts          # Run all checks in parallel
 *   VERBOSE=1 npx tsx scripts/verify.ts # Show full output on success too
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import task from 'tasuku'

const execFileAsync = promisify(execFile)

const VERBOSE = process.env.VERBOSE === '1'
const SIMPLE_OUTPUT = process.env.SIMPLE_OUTPUT === '1' || process.env.CI === '1'
const IS_TTY = (process.stdout.isTTY ?? false) && !SIMPLE_OUTPUT

// Colors
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

interface CheckConfig {
  name: string
  command: string[]
  verboseHint: string
  env?: Record<string, string>
}

interface CheckResult {
  config: CheckConfig
  success: boolean
  output: string
  status?: string
}

const checks: CheckConfig[] = [
  {
    name: 'Tests',
    command: ['bash', 'scripts/test-unit.sh'],
    verboseHint: 'pnpm run test:verbose',
    env: { FORCE_COLOR: '1' },
  },
  {
    name: 'Lint',
    command: ['npx', 'oxlint', 'src/'],
    verboseHint: 'pnpm run lint:verbose',
  },
  {
    name: 'Typecheck',
    command: ['npx', 'tsc', '--noEmit'],
    verboseHint: 'pnpm run typecheck:verbose',
  },
  {
    name: 'Format',
    command: ['npx', 'prettier', '--check', 'src/**/*.ts'],
    verboseHint: 'pnpm run format:check:verbose',
  },
]

async function runCheckSimple(config: CheckConfig): Promise<CheckResult> {
  const [cmd, ...args] = config.command
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      env: { ...process.env, ...config.env },
      maxBuffer: 10 * 1024 * 1024,
    })
    const output = (stdout + stderr).trim()

    let status: string | undefined
    if (config.name === 'Tests') {
      const passMatch = output.match(/(\d+)\s*passed/)
      if (passMatch) {
        status = `${passMatch[1]} passed`
      }
    }
    return { config, success: true, output, status }
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string }
    const output = ((err.stdout ?? '') + (err.stderr ?? '')).trim()
    return { config, success: false, output }
  }
}

async function runCheckWithStatus(
  config: CheckConfig,
  setStatus: (status: string) => void,
): Promise<CheckResult> {
  const result = await runCheckSimple(config)
  if (result.status) {
    setStatus(result.status)
  }
  return result
}

function printResult(result: CheckResult) {
  if (result.success) {
    const status = result.status ? ` ${DIM}(${result.status})${RESET}` : ''
    console.log(`${GREEN}✔${RESET} ${result.config.name}${status}`)
  } else {
    console.log(`${RED}✖${RESET} ${result.config.name}`)
    if (result.output) {
      const lines = result.output.split('\n').slice(0, 30)
      for (const line of lines) {
        console.log(`  ${DIM}${line}${RESET}`)
      }
      if (result.output.split('\n').length > 30) {
        console.log(`  ${DIM}... (truncated)${RESET}`)
      }
      console.log(`  ${YELLOW}→ ${result.config.verboseHint}${RESET}`)
    }
  }
}

async function runWithTasuku(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  await task.group(
    (t) =>
      checks.map((check) =>
        t(check.name, async ({ setStatus, setError }) => {
          const result = await runCheckWithStatus(check, setStatus)
          results.push(result)
          if (!result.success) {
            setError(new Error('failed'))
          }
          return result
        }),
      ),
    {
      concurrency: Infinity,
      stopOnError: false,
    },
  )

  results.sort(
    (a, b) =>
      checks.findIndex((c) => c.name === a.config.name) -
      checks.findIndex((c) => c.name === b.config.name),
  )

  for (const result of results) {
    printResult(result)
  }

  return results
}

async function runSimple(): Promise<CheckResult[]> {
  console.log('Verifying...')
  const results = await Promise.all(checks.map((check) => runCheckSimple(check)))
  console.log('')
  for (const result of results) {
    printResult(result)
  }
  return results
}

async function main() {
  const results = IS_TTY ? await runWithTasuku() : await runSimple()

  const failures = results.filter((r) => !r.success)
  console.log('')
  if (failures.length === 0) {
    console.log(`${GREEN}All checks passed${RESET}`)
    process.exit(0)
  } else {
    console.log(`${RED}${failures.length} check(s) failed${RESET}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
