# Ralph Progress Log: oss-prep
Started: 2026-01-27T23:36:06.388Z

## Codebase Patterns
- If verification fails with "Cannot find module" errors after branch switch, do `rm -rf node_modules && pnpm install` to fix

---

## [2026-01-28 07:59] - hot-b5cc
- Added MIT LICENSE file with copyright 2026 crcatala
- Added `"license": "MIT"` field to package.json (after description)
- Files changed: LICENSE (new), package.json
- **Learnings:** Switching branches may leave stale node_modules; clean reinstall fixes module resolution issues
---

## [2026-01-28 08:00] - hot-cdde
- Added npm publish metadata to package.json: repository, homepage, bugs, keywords, author
- Added prepublishOnly script (runs verify && build before npm publish)
- Updated files array to include LICENSE and CHANGELOG.md
- Files changed: package.json
- **Learnings:** npm pack --dry-run is useful for verifying package contents; files listed in "files" array that don't exist yet are silently ignored
---

## [2026-01-28 08:01] - hot-1d37
- Replaced hardcoded VERSION constant with dynamic read from package.json
- Used createRequire to load package.json in ESM context (works with both tsx dev and compiled dist)
- Version now appears correctly in --version output and banner text
- Files changed: src/cli/program.ts
- **Learnings:** createRequire approach is clean for JSON imports in ESM; path from src/cli/ or dist/cli/ to root package.json is ../../package.json
---

## [2026-01-28 08:02] - hot-81cd
- Created CHANGELOG.md following Keep a Changelog format (1.1.0)
- Added [Unreleased] section at top (empty)
- Added [0.1.0] section with YYYY-MM-DD placeholder for release-it
- Documented initial features: Google Hotels search, JSON output, sort options, verbose/debug modes, NO_COLOR support
- Added comparison links at bottom following keepachangelog convention
- Files changed: CHANGELOG.md (new)
- **Learnings:** Keep a Changelog uses YYYY-MM-DD date format; release-it's keep-a-changelog plugin fills in the date at release time
---
