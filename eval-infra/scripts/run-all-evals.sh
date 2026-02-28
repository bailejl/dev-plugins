#!/usr/bin/env bash
# eval-infra/scripts/run-all-evals.sh
# Run promptfoo evals for every plugin found in evals/.
# Delegates to run-plugin-evals.sh for each plugin.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVALS_DIR="$REPO_ROOT/evals"
RUN_PLUGIN="$SCRIPT_DIR/run-plugin-evals.sh"

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Run promptfoo eval suites for all plugins in evals/.

Options:
  -v, --verbose        Pass --verbose to each plugin eval run
  -n, --dry-run        Print what would be run without executing
  --stop-on-failure    Stop after the first plugin that fails
  -h, --help           Show this help message and exit

Examples:
  $(basename "$0")
  $(basename "$0") --verbose
  $(basename "$0") --stop-on-failure
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
EXTRA_ARGS=()
STOP_ON_FAILURE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)           usage; exit 0 ;;
    -v|--verbose)        EXTRA_ARGS+=("--verbose"); shift ;;
    -n|--dry-run)        EXTRA_ARGS+=("--dry-run"); shift ;;
    --stop-on-failure)   STOP_ON_FAILURE=true; shift ;;
    *)                   echo "Error: unknown option '$1'" >&2; usage >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Discover plugins
# ---------------------------------------------------------------------------
if [[ ! -d "$EVALS_DIR" ]]; then
  echo "Error: evals directory not found at $EVALS_DIR" >&2
  exit 1
fi

PLUGINS=()
for dir in "$EVALS_DIR"/*/; do
  if [[ -f "$dir/promptfooconfig.yaml" ]]; then
    plugin_name="$(basename "$dir")"
    PLUGINS+=("$plugin_name")
  fi
done

if [[ ${#PLUGINS[@]} -eq 0 ]]; then
  echo "No plugin eval configs found in $EVALS_DIR" >&2
  exit 1
fi

echo "============================================"
echo "  Running all plugin evals"
echo "  Plugins found: ${PLUGINS[*]}"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# ---------------------------------------------------------------------------
# Run each plugin
# ---------------------------------------------------------------------------
TOTAL=${#PLUGINS[@]}
PASSED=0
FAILED=0
FAILED_PLUGINS=()
START_TIME=$(date +%s)

for plugin in "${PLUGINS[@]}"; do
  echo ""
  echo ">>> [$((PASSED + FAILED + 1))/$TOTAL] $plugin"
  echo ""

  if "$RUN_PLUGIN" ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"} "$plugin"; then
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
    FAILED_PLUGINS+=("$plugin")
    if [[ "$STOP_ON_FAILURE" == "true" ]]; then
      echo ""
      echo "Stopping: $plugin failed and --stop-on-failure is set." >&2
      break
    fi
  fi
done

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================"
echo "  All evals complete"
echo "  Total:    $TOTAL"
echo "  Passed:   $PASSED"
echo "  Failed:   $FAILED"
echo "  Duration: ${ELAPSED}s"
if [[ $FAILED -gt 0 ]]; then
  echo "  Failed plugins: ${FAILED_PLUGINS[*]}"
fi
echo "============================================"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
