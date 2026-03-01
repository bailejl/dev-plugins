#!/usr/bin/env bash
# eval-infra/scripts/run-plugin-evals.sh
# Run promptfoo evals for a single plugin.
# Usage: ./run-plugin-evals.sh <plugin-name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVALS_DIR="$REPO_ROOT/evals"

# ---------------------------------------------------------------------------
# Known plugins — auto-discovered from ./plugins directory
# ---------------------------------------------------------------------------
PLUGINS_DIR="$REPO_ROOT/plugins"
KNOWN_PLUGINS=()
for dir in "$PLUGINS_DIR"/*/; do
  [[ -d "$dir" ]] && KNOWN_PLUGINS+=("$(basename "$dir")")
done

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] <plugin-name>

Run promptfoo eval suite for a single plugin.

Arguments:
  plugin-name    Name of the plugin to evaluate.
                 Must be one of: ${KNOWN_PLUGINS[*]}

Options:
  -v, --verbose  Show full promptfoo output (no summary filter)
  -n, --dry-run  Print what would be run without executing
  -h, --help     Show this help message and exit

Examples:
  $(basename "$0") frontend-dev
  $(basename "$0") --verbose ai-readiness
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
VERBOSE=false
DRY_RUN=false
PLUGIN_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)   usage; exit 0 ;;
    -v|--verbose) VERBOSE=true; shift ;;
    -n|--dry-run) DRY_RUN=true; shift ;;
    -*)          echo "Error: unknown option '$1'" >&2; usage >&2; exit 1 ;;
    *)
      if [[ -z "$PLUGIN_NAME" ]]; then
        PLUGIN_NAME="$1"; shift
      else
        echo "Error: unexpected argument '$1'" >&2; usage >&2; exit 1
      fi
      ;;
  esac
done

if [[ -z "$PLUGIN_NAME" ]]; then
  echo "Error: plugin name is required." >&2
  usage >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Validate plugin name
# ---------------------------------------------------------------------------
valid=false
for p in "${KNOWN_PLUGINS[@]}"; do
  if [[ "$p" == "$PLUGIN_NAME" ]]; then
    valid=true
    break
  fi
done

if [[ "$valid" == "false" ]]; then
  echo "Error: unknown plugin '$PLUGIN_NAME'." >&2
  echo "Valid plugins: ${KNOWN_PLUGINS[*]}" >&2
  exit 1
fi

PLUGIN_EVAL_DIR="$EVALS_DIR/$PLUGIN_NAME"

if [[ ! -d "$PLUGIN_EVAL_DIR" ]]; then
  echo "Error: eval directory not found at $PLUGIN_EVAL_DIR" >&2
  exit 1
fi

if [[ ! -f "$PLUGIN_EVAL_DIR/promptfooconfig.yaml" ]]; then
  echo "Error: promptfooconfig.yaml not found in $PLUGIN_EVAL_DIR" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Run evals
# ---------------------------------------------------------------------------
echo "============================================"
echo "  Running evals: $PLUGIN_NAME"
echo "  Config: $PLUGIN_EVAL_DIR/promptfooconfig.yaml"
echo "  Time:   $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY RUN] Would execute:"
  echo "  cd $PLUGIN_EVAL_DIR && npx promptfoo eval"
  exit 0
fi

cd "$PLUGIN_EVAL_DIR"

# Auto-load .env from repo root if it exists
ENV_ARGS=""
if [[ -f "$REPO_ROOT/.env" ]]; then
  ENV_ARGS="--env-file $REPO_ROOT/.env"
fi

START_TIME=$(date +%s)

if [[ "$VERBOSE" == "true" ]]; then
  npx promptfoo eval $ENV_ARGS
else
  npx promptfoo eval $ENV_ARGS 2>&1 | tee /dev/stderr
fi

EXIT_CODE=${PIPESTATUS[0]:-$?}
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo "============================================"
echo "  Eval complete: $PLUGIN_NAME"
echo "  Duration: ${ELAPSED}s"
echo "  Exit code: $EXIT_CODE"
echo "============================================"

if [[ -f "$PLUGIN_EVAL_DIR/.promptfoo/output.json" ]]; then
  echo ""
  echo "Results saved to: $PLUGIN_EVAL_DIR/.promptfoo/output.json"
  echo ""
  echo "View results:"
  echo "  npx promptfoo view -d $PLUGIN_EVAL_DIR/.promptfoo"
  echo ""
  echo "Compute pass@k:"
  echo "  python $SCRIPT_DIR/compute-pass-at-k.py \\"
  echo "    --results $PLUGIN_EVAL_DIR/.promptfoo/output.json \\"
  echo "    --k 1 3 5"
fi

exit "$EXIT_CODE"
