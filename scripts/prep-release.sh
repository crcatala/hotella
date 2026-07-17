#!/usr/bin/env bash
# Summarize changes that need changelog entries before a release.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Release preparation requires a clean working tree." >&2
  exit 1
fi

last_tag="$(git describe --tags --abbrev=0 2>/dev/null || true)"

if [[ -n "$last_tag" ]]; then
  echo "Changes since $last_tag:"
  git log --oneline "$last_tag"..HEAD
else
  echo "No release tag exists yet; this will be the initial release."
  echo "Commits included in v$(node --input-type=module -e "import pkg from './package.json' with { type: 'json' }; console.log(pkg.version)"):"
  git log --oneline
fi

echo
echo "Update CHANGELOG.md under [Unreleased] with user-facing Added, Changed, Fixed, Removed, or Security entries before releasing."
