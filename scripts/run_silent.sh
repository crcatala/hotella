#!/usr/bin/env bash
# run_silent.sh - Helper functions for context-efficient command output
# Adapted from raindrop-cli pattern

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# run_silent - Execute a command with minimal output
# Usage: run_silent "Description" "command to run" ["verbose_hint"]
run_silent() {
  local description="$1"
  local command="$2"
  local verbose_hint="${3:-}"

  if [ "$VERBOSE" = "1" ]; then
    echo -e "${YELLOW}→${NC} $description"
    echo "  Running: $command"
    eval "$command"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
      echo -e "${GREEN}✓${NC} $description"
    else
      echo -e "${RED}✗${NC} $description (exit code: $exit_code)"
    fi
    return $exit_code
  fi

  local tmp_file=$(mktemp)
  if eval "$command" > "$tmp_file" 2>&1; then
    printf "  ${GREEN}✓${NC} %s\n" "$description"
    rm -f "$tmp_file"
    return 0
  else
    local exit_code=$?
    printf "  ${RED}✗${NC} %s\n" "$description"

    if [ -s "$tmp_file" ]; then
      echo ""
      head -n 20 "$tmp_file"
      local lines=$(wc -l < "$tmp_file")
      if [ "$lines" -gt 20 ]; then
        echo "  ... ($((lines - 20)) more lines)"
      fi
    fi

    if [ -n "$verbose_hint" ]; then
      echo ""
      echo -e "  ${YELLOW}Run for full output:${NC} $verbose_hint"
    fi

    rm -f "$tmp_file"
    return $exit_code
  fi
}

# run_silent_test - Special handler for test commands that extracts test counts
# Usage: run_silent_test "Description" "test command" ["verbose_hint"]
run_silent_test() {
  local description="$1"
  local command="$2"
  local verbose_hint="${3:-}"

  if [ "$VERBOSE" = "1" ]; then
    echo -e "${YELLOW}→${NC} $description"
    echo "  Running: $command"
    eval "$command"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
      echo -e "${GREEN}✓${NC} $description"
    else
      echo -e "${RED}✗${NC} $description (exit code: $exit_code)"
    fi
    return $exit_code
  fi

  local tmp_file=$(mktemp)
  if eval "$command" > "$tmp_file" 2>&1; then
    # Try to extract test count from vitest output
    local summary=$(grep -oE "[0-9]+ passed" "$tmp_file" | head -1)

    if [ -n "$summary" ]; then
      printf "  ${GREEN}✓${NC} %s (%s)\n" "$description" "$summary"
    else
      printf "  ${GREEN}✓${NC} %s\n" "$description"
    fi
    rm -f "$tmp_file"
    return 0
  else
    local exit_code=$?
    printf "  ${RED}✗${NC} %s\n" "$description"

    if [ -s "$tmp_file" ]; then
      echo ""
      head -n 30 "$tmp_file"
      local lines=$(wc -l < "$tmp_file")
      if [ "$lines" -gt 30 ]; then
        echo "  ... ($((lines - 30)) more lines)"
      fi
    fi

    if [ -n "$verbose_hint" ]; then
      echo ""
      echo -e "  ${YELLOW}Run for full output:${NC} $verbose_hint"
    fi

    rm -f "$tmp_file"
    return $exit_code
  fi
}
