import { createRequire } from 'node:module'
import { Command, Option } from 'commander'
import { registerSearchCommand } from '../commands/search.js'
import { runUpdate, versionDetails, versionLine } from '../cli-meta.js'
import type { CliContext } from './context.js'
import { formatHelpFooter, formatSharedExamples } from './help.js'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json') as { version: string }
const VERSION = pkg.version

export function createProgram(ctx: CliContext): Command {
  const program = new Command()

  program.configureHelp({
    showGlobalOptions: true,
    styleTitle: (t) => ctx.colors.section(t),
    styleCommandText: (t) => ctx.colors.command(t),
    styleCommandDescription: (t) => ctx.colors.muted(t),
    styleOptionTerm: (t) => ctx.colors.option(t),
    styleOptionDescription: (t) => ctx.colors.muted(t),
    styleSubcommandTerm: (t) => ctx.colors.command(t),
    styleSubcommandDescription: (t) => ctx.colors.muted(t),
  })

  program.addHelpText(
    'beforeAll',
    () =>
      `${ctx.colors.banner('hotella')} ${ctx.colors.muted(`v${VERSION}`)} — ${ctx.colors.muted('Search hotel prices from the terminal')}\n`,
  )

  program
    .name('hotella')
    .description('Search hotel prices and availability via Google Hotels')
    .version(versionLine('hotella'), '-V, --version', 'print the version and commit')
    .action(() => {
      program.help()
    })

  // Global options
  program
    .option('--json', 'Output as JSON')
    .option('--plain', 'Plain text output')
    .option('--table', 'Aligned columnar table output')
    .option('--verbose', 'Show operational progress')
    .option('--debug', 'Show debug information (implies --verbose)')
    .option('--no-color', 'Disable colors')

  program.addHelpText('after', () => {
    const cmd = ctx.colors.command
    const dim = ctx.colors.muted

    return [
      '',
      ctx.colors.section('Examples:'),
      '',
      ...formatSharedExamples(cmd, dim),
      '',
      ...formatHelpFooter(ctx.colors.section, cmd, dim),
    ].join('\n')
  })

  registerSearchCommand(program, ctx)

  program
    .command('update')
    .description('update hotella the way it was installed')
    .option('--check', 'report only: exit 0 up to date, 1 update available, 2 unknown')
    .option('--force', 'update even when already up to date')
    .action((opts: { check?: boolean; force?: boolean }) => {
      process.exitCode = runUpdate('hotella', opts)
    })

  program
    .command('version')
    .description('print version, commit, date, install method and path')
    // `--json` is the program's global option; commander parses it there even after the
    // subcommand, so the handler reads it from optsWithGlobals() rather than a local option.
    .action((_opts: Record<string, never>, command: Command) => {
      const details = versionDetails()
      const { json } = command.optsWithGlobals() as { json?: boolean }
      console.log(
        json
          ? JSON.stringify(details)
          : Object.entries(details)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n'),
      )
    })

  return program
}
