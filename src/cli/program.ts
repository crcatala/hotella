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
      `${ctx.colors.banner('hotella')} ${ctx.colors.muted(`v${VERSION}`)} — ${ctx.colors.muted('Search hotel prices from the terminal')}\n`,
  )

  program
    .name('hotella')
    .description('Search hotel prices and availability via Google Hotels')
    .version(VERSION)
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
      `  ${cmd('hotella search "Taipei" --checkin 2026-02-10 --checkout 2026-02-17')}`,
      `  ${dim('Search hotels in Taipei for a week')}`,
      '',
      `  ${cmd('hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05 --sort price-asc --limit 5')}`,
      `  ${dim('Cheapest 5 hotels in Tokyo')}`,
      '',
      `  ${cmd('hotella search "NRT" --checkin 2026-06-01 --checkout 2026-06-07')}`,
      `  ${dim('Search using airport code (IATA → city resolution)')}`,
      '',
      `  ${cmd('hotella search "Paris" --checkin 2026-04-01 --checkout 2026-04-03 --json | jq')}`,
      `  ${dim('JSON output for scripting')}`,
      '',
      ctx.colors.section('Output Formats:'),
      '',
      `  ${cmd('--plain')}   ${dim('Human-readable list (default in TTY)')}`,
      `  ${cmd('--json')}    ${dim('Structured JSON (default in pipes)')}`,
      `  ${cmd('--table')}   ${dim('Aligned columnar table')}`,
      '',
      ctx.colors.section('Environment Variables:'),
      '',
      `  ${cmd('NO_COLOR')}  ${dim('Disable all color output (see https://no-color.org)')}`,
      '',
    ].join('\n')
  })

  registerSearchCommand(program, ctx)

  return program
}
