#!/usr/bin/env bash
# Project-specific package smoke-test checks for hotella.
#
# Sourced by scripts/test-package.sh (canonical, do not edit) after it has packed the
# tarball, installed it into $consumer and checked --help and the --version line for
# every bin. Available here: $consumer (install prefix), $archive (the packed tarball),
# $bins (space-separated command names) and the repository root as the cwd.

# The tarball must carry the build stamp; without it an installed hotella would
# report "hotella 0.1.3" with no commit, and `update` could not compare builds.
stamp_in_tarball="$(tar -tzf "$archive" | grep -c '^package/dist/build-info.json$' || true)"
if [[ "$stamp_in_tarball" != "1" ]]; then
  echo "Package smoke test failed: dist/build-info.json is missing from the tarball." >&2
  echo 'Check that package.json "files" ships dist/ and that the build runs scripts/build-info.mjs.' >&2
  exit 1
fi

# The installed build must report the version in package.json, not just a well-formed line.
package_version="$(node --input-type=module -e "import pkg from './package.json' with { type: 'json' }; console.log(pkg.version)")"
for bin in $bins; do
  line="$("$consumer/node_modules/.bin/$bin" --version)"
  reported="${line#* }"
  reported="${reported%% *}"
  if [[ "$reported" != "$package_version" ]]; then
    echo "Package smoke test failed: '$bin --version' reported '$reported', expected '$package_version'." >&2
    exit 1
  fi
done

# `update --check` must never crash an installed copy, whatever it can reach (0, 1 or 2).
status=0
"$consumer/node_modules/.bin/${bins%% *}" update --check >/dev/null 2>&1 || status=$?
if [[ $status -gt 2 ]]; then
  echo "Package smoke test failed: 'update --check' exited $status (expected 0, 1 or 2)." >&2
  exit 1
fi
