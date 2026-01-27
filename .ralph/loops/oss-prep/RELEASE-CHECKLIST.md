# Release Checklist — OSS + npm v0.1.0

## Human-in-the-loop checkpoints

This loop (`oss-prep`) is fully autonomous, but the release process requires
three human checkpoints before the package is live on npm.

### ✅ Checkpoint 1: Review oss-prep PR

**When:** After `ralph run oss-prep` completes and creates a PR.

Review the PR for:
- [ ] LICENSE text correct (MIT, correct year/owner)
- [ ] package.json metadata looks right (repo URL, keywords, author)
- [ ] CI workflow runs green on the PR itself
- [ ] `npm pack --dry-run` output only contains intended files
- [ ] `.release-it.json` config looks correct
- [ ] `pnpm run release -- --dry-run` completes without errors
- [ ] CHANGELOG.md covers 0.1.0 features accurately
- [ ] CONTRIBUTING.md matches actual tooling and workflow

### ✅ Checkpoint 2: Pre-migration verification gate (hot-4418)

**When:** After ALL three loops are merged (`core-features` + `polish` + `oss-prep`).

Run the full verification checklist on main:
```bash
# Clean slate
rm -rf node_modules dist
pnpm install --frozen-lockfile

# Full verify
pnpm run verify

# Build
pnpm run build

# Package check — verify no internal files leak
npm pack --dry-run

# Version check
node dist/cli.js --version

# Smoke test
node dist/cli.js search "Taipei" --checkin 2026-03-01 --checkout 2026-03-03 --limit 3

# npx compatibility
npx . search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-03 --limit 3

# release-it dry run
pnpm run release -- --dry-run
```

### ✅ Checkpoint 3: Final publish (hot-1ff8)

**When:** After checkpoint 2 passes. **This is irreversible.**

- [ ] Make repo public on GitHub (if not already)
- [ ] Run `pnpm run release` (release-it handles version bump, tag, GitHub release, npm publish)
- [ ] Verify: `npm info hotella` shows correct metadata
- [ ] Verify: `npx hotella --version` shows correct version
- [ ] Verify: `npx hotella search "Tokyo" --checkin 2026-03-01 --checkout 2026-03-03 --limit 3` works
- [ ] Verify: GitHub release page has correct changelog notes

## Loop execution order

```
core-features ──┐
                 ├──→ Checkpoint 2 (gate) → Checkpoint 3 (publish)
polish ─────────┤     (needs all three merged)
(after core)    │
                │
oss-prep ───────┘
(parallel)   → Checkpoint 1 (PR review)
```
