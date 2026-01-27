---
id: hot-2a08
status: open
deps: [hot-8726, hot-2758]
links: []
created: 2026-01-27T21:51:54Z
type: task
priority: 3
assignee: cc-vps
tags: [polish, ux]
---
# Rich help text with examples

Add detailed help text with examples following the cli-playbook addHelpText pattern.

Add afterAll help text to the program showing:
- Common usage examples with descriptions
- Output format explanations (--json, --plain, --table)
- Environment variables (NO_COLOR)

Examples to show:
  hotella search "Taipei" --checkin 2026-02-10 --checkout 2026-02-17
    Search hotels in Taipei for a week

  hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-05 --sort price-asc --limit 5
    Cheapest 5 hotels in Tokyo

  hotella search "NRT" --checkin 2026-06-01 --checkout 2026-06-07
    Search using airport code

  hotella search "Paris" --checkin 2026-04-01 --checkout 2026-04-03 --json | jq
    JSON output for scripting

Style examples using ctx.colors.command() for the command and ctx.colors.muted() for descriptions.

## Acceptance Criteria

- hotella --help shows usage examples
- hotella search --help shows search-specific examples
- Examples are styled with colors in TTY mode

