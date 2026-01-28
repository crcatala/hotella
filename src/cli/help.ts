/**
 * Shared help text fragments used by both the root program and search subcommand.
 */

type StyleFn = (text: string) => string

/**
 * Common usage examples shown in both `hotella --help` and `hotella search --help`.
 */
export function formatSharedExamples(cmd: StyleFn, dim: StyleFn): string[] {
  return [
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
  ]
}

/**
 * Output formats + environment variables footer, shared across help screens.
 */
export function formatHelpFooter(section: StyleFn, cmd: StyleFn, dim: StyleFn): string[] {
  return [
    section('Output Formats:'),
    '',
    `  ${cmd('--plain')}   ${dim('Human-readable list (default in TTY)')}`,
    `  ${cmd('--json')}    ${dim('Structured JSON (default in pipes)')}`,
    `  ${cmd('--table')}   ${dim('Aligned columnar table')}`,
    '',
    section('Environment Variables:'),
    '',
    `  ${cmd('NO_COLOR')}  ${dim('Disable all color output (see https://no-color.org)')}`,
    '',
  ]
}
