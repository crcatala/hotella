import { describe, expect, it } from 'vitest'
import { createContext } from '../../src/cli/context.js'
import { createProgram } from '../../src/cli/program.js'

describe('CLI arg parsing', () => {
  function makeProgram(argv: string[] = []) {
    const ctx = createContext(argv, {})
    return createProgram(ctx)
  }

  it('has search subcommand', () => {
    const program = makeProgram()
    const search = program.commands.find((c) => c.name() === 'search')
    expect(search).toBeDefined()
  })

  it('shows help output without error', () => {
    const program = makeProgram(['--help'])
    program.exitOverride()
    let helpOutput = ''
    program.configureOutput({ writeOut: (str) => (helpOutput += str) })
    try {
      program.parse(['--help'], { from: 'user' })
    } catch {
      // Commander throws on --help with exitOverride
    }
    expect(helpOutput).toContain('hotella')
    expect(helpOutput).toContain('search')
  })

  it('has global output format options', () => {
    const program = makeProgram()
    const opts = program.options.map((o) => o.long)
    expect(opts).toContain('--json')
    expect(opts).toContain('--plain')
    expect(opts).toContain('--table')
    expect(opts).toContain('--verbose')
    expect(opts).toContain('--debug')
  })

  it('search command has required date options', () => {
    const program = makeProgram()
    const search = program.commands.find((c) => c.name() === 'search')!
    const opts = search.options.map((o) => o.long)
    expect(opts).toContain('--checkin')
    expect(opts).toContain('--checkout')
  })

  it('search command has filter options', () => {
    const program = makeProgram()
    const search = program.commands.find((c) => c.name() === 'search')!
    const opts = search.options.map((o) => o.long)
    expect(opts).toContain('--min-price')
    expect(opts).toContain('--max-price')
    expect(opts).toContain('--min-rating')
  })

  it('search command has sort and limit options', () => {
    const program = makeProgram()
    const search = program.commands.find((c) => c.name() === 'search')!
    const opts = search.options.map((o) => o.long)
    expect(opts).toContain('--sort')
    expect(opts).toContain('--limit')
  })

  it('search command has currency option', () => {
    const program = makeProgram()
    const search = program.commands.find((c) => c.name() === 'search')!
    const opts = search.options.map((o) => o.long)
    expect(opts).toContain('--currency')
  })
})

describe('CLI context creation', () => {
  it('defaults to json format when not TTY', () => {
    const ctx = createContext([], {})
    // In test environment, stdout is not a TTY
    expect(ctx.output.format).toBe('json')
  })

  it('respects --json flag', () => {
    const ctx = createContext(['--json'], {})
    expect(ctx.output.format).toBe('json')
  })

  it('respects --plain flag', () => {
    const ctx = createContext(['--plain'], {})
    expect(ctx.output.format).toBe('plain')
  })

  it('respects --table flag', () => {
    const ctx = createContext(['--table'], {})
    expect(ctx.output.format).toBe('table')
  })

  it('enables verbose with --verbose', () => {
    const ctx = createContext(['--verbose'], {})
    expect(ctx.output.verbose).toBe(true)
  })

  it('enables verbose and debug with --debug', () => {
    const ctx = createContext(['--debug'], {})
    expect(ctx.output.debug).toBe(true)
    expect(ctx.output.verbose).toBe(true)
  })

  it('disables color with NO_COLOR env', () => {
    const ctx = createContext([], { NO_COLOR: '1' })
    expect(ctx.output.color).toBe(false)
  })

  it('disables color with --no-color flag', () => {
    const ctx = createContext(['--no-color'], {})
    expect(ctx.output.color).toBe(false)
  })
})
