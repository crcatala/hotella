import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const PROJECT_DIR = join(__dirname, '..', '..')
const CLI_PATH = join(PROJECT_DIR, 'dist', 'cli.js')

interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}

// Build once before all integration tests so we run against compiled JS (fast)
// instead of npx tsx (slow ~1.4s startup per invocation).
beforeAll(async () => {
  await execFileAsync('npx', ['tsgo'], { cwd: PROJECT_DIR, timeout: 30_000 })
}, 30_000)

async function runCli(args: string[]): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI_PATH, ...args], {
      timeout: 10_000,
      env: { ...process.env, NO_COLOR: '1' },
    })
    return { stdout, stderr, exitCode: 0 }
  } catch (error: unknown) {
    const err = error as {
      stdout?: string
      stderr?: string
      code?: number | string
      status?: number
    }
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: typeof err.code === 'number' ? err.code : (err.status ?? 1),
    }
  }
}

describe('CLI integration', () => {
  describe('--version', () => {
    it('exits with code 0 and shows version', async () => {
      const result = await runCli(['--version'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })

  describe('--help', () => {
    it('exits with code 0 and shows help', async () => {
      const result = await runCli(['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('hotella')
      expect(result.stdout).toContain('search')
    })
  })

  describe('search --help', () => {
    it('exits with code 0 and shows search help', async () => {
      const result = await runCli(['search', '--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('checkin')
      expect(result.stdout).toContain('checkout')
    })
  })

  describe('validation errors', () => {
    it('exits with code 2 for bad date format', async () => {
      const result = await runCli([
        'search',
        'Tokyo',
        '--checkin',
        'not-a-date',
        '--checkout',
        '2026-12-10',
      ])
      expect(result.exitCode).toBe(2)
      expect(result.stderr).toContain('Invalid')
    })

    it('exits with code 2 for checkout before checkin', async () => {
      const result = await runCli([
        'search',
        'Tokyo',
        '--checkin',
        '2026-12-10',
        '--checkout',
        '2026-12-05',
      ])
      expect(result.exitCode).toBe(2)
      expect(result.stderr).toContain('after')
    })

    it('exits with code 2 for invalid guest count', async () => {
      const result = await runCli([
        'search',
        'Tokyo',
        '--checkin',
        '2026-12-10',
        '--checkout',
        '2026-12-15',
        '--adults',
        '0',
      ])
      expect(result.exitCode).toBe(2)
      expect(result.stderr).toContain('Adults')
    })

    it('exits with code 2 for invalid sort mode', async () => {
      const result = await runCli([
        'search',
        'Tokyo',
        '--checkin',
        '2026-12-10',
        '--checkout',
        '2026-12-15',
        '--sort',
        'invalid',
      ])
      expect(result.exitCode).toBe(2)
      expect(result.stderr).toContain('Invalid sort mode')
    })

    it('exits with code 2 for unsupported currency', async () => {
      const result = await runCli([
        'search',
        'Tokyo',
        '--checkin',
        '2026-12-10',
        '--checkout',
        '2026-12-15',
        '--currency',
        'XYZ',
      ])
      expect(result.exitCode).toBe(2)
      expect(result.stderr).toContain('Unsupported currency')
    })
  })

  describe('missing required arguments', () => {
    it('exits with non-zero for missing location', async () => {
      const result = await runCli(['search', '--checkin', '2026-12-10', '--checkout', '2026-12-15'])
      expect(result.exitCode).not.toBe(0)
    })

    it('exits with non-zero for missing checkin', async () => {
      const result = await runCli(['search', 'Tokyo', '--checkout', '2026-12-15'])
      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('stdout/stderr separation', () => {
    it('help goes to stdout', async () => {
      const result = await runCli(['--help'])
      expect(result.stdout.length).toBeGreaterThan(0)
    })

    it('errors go to stderr', async () => {
      const result = await runCli([
        'search',
        'Tokyo',
        '--checkin',
        'bad',
        '--checkout',
        '2026-12-10',
      ])
      expect(result.stderr.length).toBeGreaterThan(0)
    })
  })
})
