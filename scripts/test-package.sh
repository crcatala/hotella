#!/usr/bin/env bash
# Smoke-test the exact npm tarball that will be published.
# Run via `pnpm run test:package`, which builds dist/ first.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PACKAGE_NAME="$(node --input-type=module -e "import pkg from './package.json' with { type: 'json' }; console.log(pkg.name)")"
PACKAGE_VERSION="$(node --input-type=module -e "import pkg from './package.json' with { type: 'json' }; console.log(pkg.version)")"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/hotella-package-test.XXXXXX")"
trap 'rm -rf "$TEMP_DIR"' EXIT

npm pack --pack-destination "$TEMP_DIR" --ignore-scripts >/dev/null
TARBALL="$(find "$TEMP_DIR" -maxdepth 1 -name '*.tgz' -print -quit)"

if [[ -z "$TARBALL" ]]; then
  echo "Package smoke test failed: npm pack did not produce a tarball." >&2
  exit 1
fi

npm install --prefix "$TEMP_DIR/install" --ignore-scripts "$TARBALL" >/dev/null
BINARY="$TEMP_DIR/install/node_modules/.bin/hotella"

if [[ ! -x "$BINARY" ]]; then
  echo "Package smoke test failed: hotella binary was not installed." >&2
  exit 1
fi

if [[ "$("$BINARY" --version)" != "$PACKAGE_VERSION" ]]; then
  echo "Package smoke test failed: installed version does not match $PACKAGE_NAME@$PACKAGE_VERSION." >&2
  exit 1
fi

"$BINARY" --help >/dev/null
printf 'Package smoke test passed: %s@%s\n' "$PACKAGE_NAME" "$PACKAGE_VERSION"
