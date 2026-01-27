---
id: hot-a9e1
status: open
deps: [hot-2758]
links: []
created: 2026-01-27T21:52:17Z
type: feature
priority: 3
assignee: cc-vps
tags: [future, ux]
---
# Config file for default preferences

Add support for a config file at ~/.config/hotella/config.json for storing default preferences.

Configurable defaults:
- currency (default USD)
- adults (default 2)
- sort mode (default value)
- browser (default chrome)
- output format
- proxy

Config should be overridable by CLI flags. Load config early in the command pipeline and merge with CLI options.

## Acceptance Criteria

- Config file loaded from ~/.config/hotella/config.json
- All persistent preferences configurable
- CLI flags override config file values
- Missing config file is not an error

