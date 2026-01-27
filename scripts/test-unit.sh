#!/bin/bash
# Run only unit tests (excluding *.live.test.ts files)
# This ensures no API calls are made during unit testing
#
# All additional arguments are passed through to vitest, e.g.:
#   ./scripts/test-unit.sh --bail
#   ./scripts/test-unit.sh --reporter verbose

set -e

exec npx vitest run tests/unit tests/integration "$@"
