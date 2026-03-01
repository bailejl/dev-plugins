#!/usr/bin/env bash
# record-baseline.sh — Record eval metrics to history file.
#
# Usage: ./eval-infra/scripts/record-baseline.sh <plugin-name>
# Appends a JSON record to evals/<plugin>/eval-history.jsonl

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <plugin-name>"
  exit 1
fi

PLUGIN_NAME="$1"
EVAL_DIR="${REPO_ROOT}/evals/${PLUGIN_NAME}"
OUTPUT_FILE="${EVAL_DIR}/.promptfoo/output.json"
HISTORY_FILE="${EVAL_DIR}/eval-history.jsonl"

if [ ! -f "$OUTPUT_FILE" ]; then
  echo "Error: No output.json found at ${OUTPUT_FILE}"
  echo "Run evals first: npm run eval:${PLUGIN_NAME}"
  exit 1
fi

# Get git info
GIT_COMMIT=$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo "unknown")
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Compute metrics using compute-pass-at-k.py
METRICS_JSON=$(python "${REPO_ROOT}/eval-infra/scripts/compute-pass-at-k.py" \
  --results "$OUTPUT_FILE" \
  --k 1 3 5 \
  --group-by evalType \
  --json 2>/dev/null || echo '{}')

# Build history record
RECORD=$(node -e "
const metrics = JSON.parse(process.argv[1] || '{}');
const record = {
  date: '${DATE}',
  gitCommit: '${GIT_COMMIT}',
  gitBranch: '${GIT_BRANCH}',
  plugin: '${PLUGIN_NAME}',
  metrics: metrics
};
console.log(JSON.stringify(record));
" "$METRICS_JSON")

# Append to history
echo "$RECORD" >> "$HISTORY_FILE"
echo "Recorded baseline for ${PLUGIN_NAME} at ${DATE} (commit: ${GIT_COMMIT})"
echo "  History: ${HISTORY_FILE}"
