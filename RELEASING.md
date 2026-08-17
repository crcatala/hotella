# Releasing

Hotella uses [release-it](https://github.com/release-it/release-it) for manual releases from a maintainer machine. A release validates the npm package, updates the changelog and version, publishes `hotella` publicly to npm, pushes a release commit and tag, and creates a GitHub Release.

## Prerequisites

- Push access to `crcatala/hotella`
- The repository is public
- An npm account authorized to publish `hotella` (`npm whoami`)
- A `GITHUB_TOKEN` with repository **Contents: read and write** permission
- Node.js 22.21+ or 24+ and pnpm
- A clean checkout on `main`

## Before releasing

1. Update main:

   ```bash
   git checkout main
   git pull --ff-only
   ```

2. Prepare the changelog. The helper shows commits since the last tag:

   ```bash
   pnpm run release:prep
   ```

   Add user-facing entries under `## [Unreleased]` in `CHANGELOG.md`, using [Keep a Changelog](https://keepachangelog.com/) sections such as Added, Changed, Fixed, Removed, or Security.

3. Run the full verification suite:

   ```bash
   pnpm run verify
   ```

   This runs tests, linting, type checking, formatting, a build, and an install smoke test of the exact `npm pack` tarball.

## Release

Preview the local release steps first:

```bash
pnpm run release:dry
```

`release:dry` disables npm publishing and GitHub Release creation. Then release interactively:

```bash
export GITHUB_TOKEN=github_pat_... # if not already configured
pnpm run release
```

Release-it validates main, updates the changelog and version, rebuilds and smoke-tests the package, publishes `hotella` with public access, pushes the commit and tag, and creates the GitHub Release.

## Verify the release

```bash
npm view hotella
npx hotella@latest --version
npx hotella@latest --help
```

Published npm versions are immutable. If a release has a defect, publish a corrective version rather than replacing it.
