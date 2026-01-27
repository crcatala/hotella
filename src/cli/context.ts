import kleur from 'kleur'

export type OutputFormat = 'json' | 'plain' | 'table'

export type OutputConfig = {
  color: boolean
  format: OutputFormat
  verbose: boolean
  debug: boolean
}

export type CliContext = {
  isTty: boolean
  output: OutputConfig
  colors: {
    banner: (t: string) => string
    section: (t: string) => string
    command: (t: string) => string
    option: (t: string) => string
    muted: (t: string) => string
    success: (t: string) => string
    warning: (t: string) => string
    error: (t: string) => string
  }
  prefix: {
    ok: string
    warn: string
    err: string
    info: string
  }
}

export function createContext(argv: string[], env: Record<string, string | undefined>): CliContext {
  const isTty = process.stdout.isTTY ?? false
  const noColor = argv.includes('--no-color') || env.NO_COLOR !== undefined
  const debug = argv.includes('--debug')
  const verbose = argv.includes('--verbose') || debug

  let format: OutputFormat = isTty ? 'plain' : 'json'
  if (argv.includes('--json')) format = 'json'
  else if (argv.includes('--table')) format = 'table'
  else if (argv.includes('--plain')) format = 'plain'

  const color = isTty && !noColor && format === 'plain'
  kleur.enabled = color

  const style =
    (styler: (text: string) => string) =>
    (text: string): string =>
      color ? styler(text) : text

  const colors = {
    banner: style((t) => kleur.bold().blue(t)),
    section: style((t) => kleur.bold().white(t)),
    command: style((t) => kleur.bold().cyan(t)),
    option: style((t) => kleur.cyan(t)),
    muted: style((t) => kleur.gray(t)),
    success: style((t) => kleur.green(t)),
    warning: style((t) => kleur.yellow(t)),
    error: style((t) => kleur.red(t)),
  }

  const usePlainPrefix = !color
  const prefix = usePlainPrefix
    ? { ok: '[OK] ', warn: '[WARN] ', err: '[ERR] ', info: '[INFO] ' }
    : { ok: '✓ ', warn: '⚠ ', err: '✗ ', info: 'ℹ ' }

  return { isTty, output: { color, format, verbose, debug }, colors, prefix }
}
