# Releasing

Releases are cut by hand from a clean `main` with
[Release It!](https://github.com/release-it/release-it), wrapped by
[`scripts/release.mjs`](scripts/release.mjs). One command checks the changelog
and the build, bumps the version, moves the Unreleased section of the changelog
into the new version, commits, tags `vX.Y.Z`, pushes, publishes `hotella` to
npm, and creates the GitHub Release from that tag.

The release commit is `chore: release vX.Y.Z` and the tag is `vX.Y.Z`, tagged
with the message `Release X.Y.Z`. The tag is what `hotella update` and
`npx hotella@<version>` resolve, and what builds report in their version line.

## Preconditions

- `main` is the release branch and the checkout is clean.
- `pnpm install` has been run, so `node_modules/.bin/release-it` exists.
- You are logged in to npm with publish rights for `hotella`: `npm view hotella version` should work and `npm whoami` must show your account (`npm login` if not).
- A GitHub token in `GITHUB_TOKEN` with **Contents: read and write**, or a `gh` login for release-it to create the GitHub Release. Without either, release-it opens the release form in the browser.

## 1. Prepare the changelog

Start from an up-to-date `main`:

```bash
git switch main
git pull --ff-only
```

Draft the entries with the prep script, which prints a prompt followed by the
commits and changed files since the last `vX.Y.Z` tag:

```bash
pnpm run release:prep
```

Paste the prompt into an LLM, review the draft, and put it under
`## [Unreleased]` in `CHANGELOG.md`, in Keep a Changelog sections (Added,
Changed, Fixed, Removed, Security). Keep only user-facing changes: no tests, CI,
refactors or routine dependency updates. Commit and push the draft:

```bash
git add CHANGELOG.md
git commit -m "docs: draft changelog for the next release"
git push
```

## 2. Verify

```bash
pnpm run verify          # tests, lint, typecheck, format, build, package smoke test
pnpm run release:dry     # release-it dry run: shows the bump, commit and tag it would make
```

## 3. Release

```bash
pnpm run release                 # asks for the version
pnpm run release -- patch        # or patch | minor | major, or an explicit X.Y.Z
pnpm run release -- --preRelease=beta   # 1.5.0-beta.0, published under the "beta" dist-tag
```

In order, this:

1. refuses to start without an npm login, or when `HEAD` is already the
   `vX.Y.Z` release (if only the publish failed, use `pnpm run release:publish`);
2. runs `bash scripts/check-changelog.sh` (Unreleased must have entries) and
   `pnpm run verify`;
3. bumps `package.json`, moves Unreleased into `## [X.Y.Z] - YYYY-MM-DD` and
   adds a fresh empty Unreleased, then runs the package smoke test;
4. commits `chore: release vX.Y.Z`, tags `vX.Y.Z`, pushes the commit and the tag;
5. publishes `hotella` to npm **from the tagged commit** (`scripts/release.mjs`,
   after release-it; npm may ask for a one-time password);
6. creates the GitHub Release `vX.Y.Z` from the tag.

A prerelease is published under a dist-tag named after its identifier, so
`latest` keeps pointing at the last full release. `npm run release -- --npm.tag=next`
chooses another tag; `pnpm run release:publish -- --tag <tag>` does the same for a
resumed publish.

## When a step fails

Each step is separate, so a failure leaves the earlier steps done.

- **Before the commit** (steps 1–3): nothing changed on the remote. Fix the
  cause and run `pnpm run release` again. `git checkout -- .` discards a
  half-made bump.
- **Push or GitHub Release** (steps 4 and 6): the commit and tag exist locally
  (`git log -1`, `git tag --points-at HEAD`). Push them with
  `git push --follow-tags`, then create the release from the tag's changelog
  section: `gh release create vX.Y.Z --title vX.Y.Z --notes-file <section>`.
- **npm publish** (step 5): only the publish is left. Run
  `pnpm run release:publish` from the tagged commit; it rechecks the login, the
  tag, the clean tree and whether the version is already on npm, then publishes
  with the right dist-tag.

Published npm versions are immutable. If a release is defective, publish a
corrective version instead of trying to replace it.

## Verify the release

```bash
npm view hotella version
npx hotella@latest --version    # hotella X.Y.Z (sha7 YYYY-MM-DD)
npx hotella@latest --help
npx hotella@latest update --check
```
