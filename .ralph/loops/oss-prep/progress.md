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

## [2026-01-28 08:03] - hot-605d
- Created CONTRIBUTING.md with all required sections
- Covers prerequisites (Node 22+, pnpm), getting started, development commands table
- Documents project structure (src/cli/, src/commands/, src/lib/)
- Explains branch workflow, PR process, and code style enforcement (oxlint + prettier)
- References verify script as single source of truth for CI checks
- Includes release process section pointing to release-it config
- Files changed: CONTRIBUTING.md (new)
- **Learnings:** The verify script aggregates all checks; documenting it as the CI gate simplifies contributor guidance
---

## [2026-01-28 08:04] - hot-9e30
- Created .github/workflows/ci.yml for CI on PRs and pushes to main
- Single job workflow using pnpm/action-setup and actions/setup-node
- Pins Node to version 22, uses pnpm cache, installs with --frozen-lockfile
- Runs pnpm run verify as the single check (covers lint, typecheck, format, test, build)
- Files changed: .github/workflows/ci.yml (new)
- **Learnings:** Version tags used for now (v4); SHA pinning deferred to hot-995a per task notes
---

## [2026-01-28 08:05] - hot-995a
- Pinned all GitHub Actions in ci.yml to SHA commits
- Updated actions/checkout v4 → v4.3.1 (34e114876b0b11c390a56381ad16ebd13914f8d5)
- Updated pnpm/action-setup v4 → v4.2.0 (41ff72655975bd51cab0327fa583b6e92b6d3061)
- Updated actions/setup-node v4 → v4.4.0 (49933ea5288caeca8642d1e84afbd3f7d6820020)
- Each SHA has a version comment for human readability
- Files changed: .github/workflows/ci.yml
- **Learnings:** Use git ls-remote --tags to lookup SHAs; for annotated tags, the ^{} entry is the actual commit
---

## [2026-01-28 08:06] - hot-9fcd
- Created .github/workflows/secret-scan.yml for secret scanning on PRs and pushes to main
- Uses gitleaks/gitleaks-action for detecting secrets in code
- Action pinned to SHA ff98106e4c7b2bc287b24eaf42907196329070c7 (v2.3.9) with version comment
- Includes checkout with fetch-depth: 0 for full history scanning
- Files changed: .github/workflows/secret-scan.yml (new)
- **Learnings:** Gitleaks requires fetch-depth: 0 for proper scanning of git history
---

## [2026-01-28 08:07] - hot-ba0c
- Created .github/CODEOWNERS file for workflow protection
- Added rule: /.github/workflows/ owned by @crcatala
- Follows GitHub CODEOWNERS syntax with documentation link
- Files changed: .github/CODEOWNERS (new)
- **Learnings:** CODEOWNERS path patterns use leading slash for repo root; simple one-rule file is sufficient for workflow protection
---
