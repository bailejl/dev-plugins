#!/usr/bin/env bash
# validate-plugin.sh — Validate plugin structure and eval coverage.
#
# Usage: ./eval-infra/scripts/validate-plugin.sh <plugin-name>
# Exit 0 on success, 1 on validation failure.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <plugin-name>"
  echo "Example: $0 ai-readiness"
  exit 1
fi

PLUGIN_NAME="$1"
PLUGIN_DIR="${REPO_ROOT}/plugins/${PLUGIN_NAME}"
EVAL_DIR="${REPO_ROOT}/evals/${PLUGIN_NAME}"
ERRORS=()

echo "Validating plugin: ${PLUGIN_NAME}"
echo "---"

# 1. Check plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
  ERRORS+=("Plugin directory not found: plugins/${PLUGIN_NAME}/")
fi

# 2. Check plugin.json exists and has required fields
PLUGIN_JSON="${PLUGIN_DIR}/.claude-plugin/plugin.json"
if [ ! -f "$PLUGIN_JSON" ]; then
  ERRORS+=("Plugin manifest not found: .claude-plugin/plugin.json")
else
  # Check required fields using node (jq may not be available)
  for field in name version description; do
    if ! node -e "const p=require('${PLUGIN_JSON}'); if(!p.${field}) process.exit(1);" 2>/dev/null; then
      ERRORS+=("plugin.json missing required field: ${field}")
    fi
  done
  echo "  ✓ plugin.json has required fields"
fi

# 3. Check at least one command exists
COMMANDS_DIR="${PLUGIN_DIR}/commands"
if [ ! -d "$COMMANDS_DIR" ]; then
  ERRORS+=("No commands/ directory found")
else
  CMD_COUNT=$(find "$COMMANDS_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$CMD_COUNT" -eq 0 ]; then
    ERRORS+=("No command .md files found in commands/")
  else
    echo "  ✓ ${CMD_COUNT} command(s) found"
  fi
fi

# 4. Check eval directory exists
if [ ! -d "$EVAL_DIR" ]; then
  ERRORS+=("Eval directory not found: evals/${PLUGIN_NAME}/")
else
  # Check promptfooconfig.yaml exists
  if [ ! -f "${EVAL_DIR}/promptfooconfig.yaml" ]; then
    ERRORS+=("Missing promptfooconfig.yaml in evals/${PLUGIN_NAME}/")
  else
    echo "  ✓ promptfooconfig.yaml exists"
  fi

  # Check for at least one positive suite
  POSITIVE_SUITES=$(find "${EVAL_DIR}/suites" -name "*.yaml" ! -name "*-neg.yaml" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$POSITIVE_SUITES" -eq 0 ]; then
    ERRORS+=("No positive test suites found in evals/${PLUGIN_NAME}/suites/")
  else
    echo "  ✓ ${POSITIVE_SUITES} positive suite(s)"
  fi

  # Check for at least one negative suite
  NEGATIVE_SUITES=$(find "${EVAL_DIR}/suites" -name "*-neg.yaml" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$NEGATIVE_SUITES" -eq 0 ]; then
    ERRORS+=("No negative test suites found (expected *-neg.yaml files)")
  else
    echo "  ✓ ${NEGATIVE_SUITES} negative suite(s)"
  fi
fi

# Summary
echo "---"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "FAIL: ${#ERRORS[@]} validation error(s):"
  for err in "${ERRORS[@]}"; do
    echo "  ✗ ${err}"
  done
  exit 1
else
  echo "PASS: Plugin '${PLUGIN_NAME}' is valid."
  exit 0
fi
