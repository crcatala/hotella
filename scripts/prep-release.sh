#!/usr/bin/env bash
# Summarize changes that need changelog entries before a release.
# Usage: scripts/prep-release.sh [last-tag-or-commit]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release preparation requires a clean working tree." >&2
  exit 1
fi

last_tag="${1:-$(git describe --tags --abbrev=0 2>/dev/null || true)}"

if [[ -n "$last_tag" ]] && ! git rev-parse --verify --quiet "${last_tag}^{commit}" >/dev/null; then
  echo "Error: '$last_tag' is not a valid tag or commit." >&2
  exit 1
fi

if [[ -n "$last_tag" ]]; then
  range="${last_tag}..HEAD"
  empty_tree=""
else
  range="HEAD"
  empty_tree="$(git hash-object -t tree /dev/null)"
fi

if [[ -n "$last_tag" ]]; then
  echo "Changes since $last_tag:"
else
  echo "No release tag exists yet; this will be the initial release."
  echo "Commits included in v$(node --input-type=module -e "import pkg from './package.json' with { type: 'json' }; console.log(pkg.version)"):"
fi

echo
if [[ -z "$(git log "$range" --format=%H --no-merges)" ]]; then
  echo "(no commits)"
else
  git log "$range" --pretty=format:'- %s (%h)' --no-merges
  echo
fi

echo
echo "Files changed:"
if [[ -n "$last_tag" ]]; then
  git diff --stat "$range" | tail -10
else
  git diff --stat "$empty_tree" HEAD | tail -10
fi

echo
echo "Update CHANGELOG.md under [Unreleased] with user-facing Added, Changed, Fixed, Removed, or Security entries before releasing."
echo
echo "=== AI Prompt Template ==="
cat <<'EOF'
Review the commits below and generate changelog entries in Keep a Changelog format.
Group entries under Added, Changed, Fixed, Removed, and Security; include only sections with entries.
Include only user-facing changes. Exclude tests, CI, internal refactors, and routine dependency updates unless they affect users.
Be concise and include PR or issue numbers in parentheses where they are mentioned.

Format example:
### Added
- New feature description (#123)

### Fixed
- Bug fix description

Commits to review:
EOF
git log "$range" --pretty=format:'- %s' --no-merges
echo
