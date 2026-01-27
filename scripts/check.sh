#!/usr/bin/env bash
# check.sh - Run individual checks with minimal output
#
# Usage:
#   ./scripts/check.sh test        # Run tests silently
#   ./scripts/check.sh lint        # Run linting silently
#   ./scripts/check.sh typecheck   # Run typecheck silently
#   ./scripts/check.sh format      # Run format check silently
#   ./scripts/check.sh format-fix  # Run format fix silently
#
#   VERBOSE=1 ./scripts/check.sh test  # Full output
#
# Additional args are passed to the underlying command:
#   ./scripts/check.sh test --bail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/run_silent.sh"

cmd="$1"
shift 2>/dev/null || true
extra_args="$*"

case "$cmd" in
  test)
    run_silent_test "Unit Tests" "FORCE_COLOR=1 bash scripts/test-unit.sh $extra_args" "pnpm run test:verbose $extra_args"
    ;;
  test:live)
    run_silent_test "Live Tests" "HOTELLA_LIVE_TEST=1 npx vitest run tests/live $extra_args" "pnpm run test:live:verbose $extra_args"
    ;;
  test:all)
    run_silent_test "All Tests" "HOTELLA_LIVE_TEST=1 npx vitest run $extra_args" "pnpm run test:all:verbose $extra_args"
    ;;
  lint)
    run_silent "Lint" "npx oxlint src/ $extra_args" "pnpm run lint:verbose"
    ;;
  typecheck)
    run_silent "Typecheck" "npx tsc --noEmit $extra_args" "pnpm run typecheck:verbose"
    ;;
  format)
    run_silent "Format" "npx prettier --check 'src/**/*.ts' $extra_args" "pnpm run format:check:verbose"
    ;;
  format-fix)
    run_silent "Format (fix)" "npx prettier --write 'src/**/*.ts' $extra_args" "pnpm run format:verbose"
    ;;
  *)
    echo "Usage: $0 {test|test:live|test:all|lint|typecheck|format|format-fix} [extra args...]"
    echo ""
    echo "Runs the specified check with minimal output."
    echo "Set VERBOSE=1 for full output."
    echo ""
    echo "Examples:"
    echo "  $0 test                     # Run unit tests"
    echo "  $0 lint                     # Run oxlint"
    echo "  $0 typecheck                # Run tsc --noEmit"
    exit 1
    ;;
esac
