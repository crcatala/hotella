import { Command, Option } from 'commander'
import { registerSearchCommand } from '../commands/search.js'
import type { CliContext } from './context.js'

const VERSION = '0.1.0'

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
      `${ctx.colors.banner('hotels')} ${ctx.colors.muted(`v${VERSION}`)} — ${ctx.colors.muted('Search hotel prices from the terminal')}\n`,
  )

  program
    .name('hotels')
    .description('Search hotel prices and availability via Google Hotels')
    .version(VERSION)
    .action(() => {
      program.help()
    })

  // Global options
  program
    .option('--json', 'Output as JSON')
    .option('--plain', 'Plain text output')
    .option('--verbose', 'Show operational progress')
    .option('--debug', 'Show debug information (implies --verbose)')
    .option('--no-color', 'Disable colors')

  registerSearchCommand(program, ctx)

  return program
}
