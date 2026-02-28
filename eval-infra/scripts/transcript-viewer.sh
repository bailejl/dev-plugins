#!/usr/bin/env bash
# eval-infra/scripts/transcript-viewer.sh
# Quick-view failed test transcripts from promptfoo output.
# Usage: ./transcript-viewer.sh <promptfoo-output-dir-or-file>

set -euo pipefail

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] <path>

Display failed test transcripts from promptfoo eval output.

Arguments:
  path    Path to a promptfoo output directory (containing output.json)
          or directly to an output.json file.

Options:
  -a, --all          Show all transcripts, not just failures
  -s, --short        Show abbreviated transcripts (first/last 3 turns)
  -t, --test <name>  Filter to a specific test by description substring
  -c, --count        Only print the count of passed/failed tests
  -h, --help         Show this help message and exit

Examples:
  $(basename "$0") evals/frontend-dev/.promptfoo
  $(basename "$0") evals/ai-readiness/.promptfoo/output.json
  $(basename "$0") --short --test "scaffold" evals/frontend-dev/.promptfoo
  $(basename "$0") --count evals/frontend-dev/.promptfoo
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
SHOW_ALL=false
SHORT_MODE=false
COUNT_ONLY=false
TEST_FILTER=""
TARGET_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)    usage; exit 0 ;;
    -a|--all)     SHOW_ALL=true; shift ;;
    -s|--short)   SHORT_MODE=true; shift ;;
    -c|--count)   COUNT_ONLY=true; shift ;;
    -t|--test)
      if [[ $# -lt 2 ]]; then
        echo "Error: --test requires an argument" >&2; exit 1
      fi
      TEST_FILTER="$2"; shift 2
      ;;
    -*)           echo "Error: unknown option '$1'" >&2; usage >&2; exit 1 ;;
    *)
      if [[ -z "$TARGET_PATH" ]]; then
        TARGET_PATH="$1"; shift
      else
        echo "Error: unexpected argument '$1'" >&2; usage >&2; exit 1
      fi
      ;;
  esac
done

if [[ -z "$TARGET_PATH" ]]; then
  echo "Error: path argument is required." >&2
  usage >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve output.json path
# ---------------------------------------------------------------------------
if [[ -f "$TARGET_PATH" ]]; then
  OUTPUT_FILE="$TARGET_PATH"
elif [[ -d "$TARGET_PATH" ]]; then
  OUTPUT_FILE="$TARGET_PATH/output.json"
  if [[ ! -f "$OUTPUT_FILE" ]]; then
    echo "Error: output.json not found in $TARGET_PATH" >&2
    exit 1
  fi
else
  echo "Error: path not found: $TARGET_PATH" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Check for jq
# ---------------------------------------------------------------------------
if ! command -v jq &>/dev/null; then
  echo "Error: jq is required but not installed." >&2
  echo "Install it: brew install jq  (macOS) or apt-get install jq (Linux)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Extract and display results
# ---------------------------------------------------------------------------

# Build jq filter for results array
RESULTS_PATH='.results.results // .results // []'

# Count pass/fail
TOTAL=$(jq "$RESULTS_PATH | length" "$OUTPUT_FILE")
PASSED=$(jq "$RESULTS_PATH | map(select(.success == true)) | length" "$OUTPUT_FILE")
FAILED=$((TOTAL - PASSED))

echo "============================================"
echo "  Transcript Viewer"
echo "  Source: $OUTPUT_FILE"
echo "  Total: $TOTAL  Passed: $PASSED  Failed: $FAILED"
echo "============================================"

if [[ "$COUNT_ONLY" == "true" ]]; then
  exit 0
fi

# Build jq filter for test selection
if [[ "$SHOW_ALL" == "true" ]]; then
  STATUS_FILTER='.'
else
  STATUS_FILTER='select(.success == false)'
fi

if [[ -n "$TEST_FILTER" ]]; then
  NAME_FILTER="select(.testCase.description // \"\" | test(\"$TEST_FILTER\"; \"i\"))"
else
  NAME_FILTER='.'
fi

# Extract matching results
MATCHES=$(jq -c "$RESULTS_PATH | .[] | $STATUS_FILTER | $NAME_FILTER" "$OUTPUT_FILE")

if [[ -z "$MATCHES" ]]; then
  if [[ "$SHOW_ALL" == "true" ]]; then
    echo ""
    echo "No matching tests found."
  else
    echo ""
    echo "No failed tests found. All $TOTAL tests passed."
  fi
  exit 0
fi

INDEX=0
echo "$MATCHES" | while IFS= read -r result; do
  INDEX=$((INDEX + 1))

  DESC=$(echo "$result" | jq -r '.testCase.description // "unnamed"')
  SUCCESS=$(echo "$result" | jq -r '.success')
  SCORE=$(echo "$result" | jq -r '.score // "N/A"')

  echo ""
  echo "--------------------------------------------"
  echo "  #$INDEX: $DESC"
  echo "  Status: $(if [[ "$SUCCESS" == "true" ]]; then echo "PASS"; else echo "FAIL"; fi)  Score: $SCORE"
  echo "--------------------------------------------"

  # Show assertion failures
  FAILURES=$(echo "$result" | jq -r '
    .gradingResult.componentResults // [] |
    map(select(.pass == false)) |
    .[] |
    "  FAIL: \(.assertion.type // "unknown") — \(.reason // "no reason")"
  ')

  if [[ -n "$FAILURES" ]]; then
    echo ""
    echo "  Assertion failures:"
    echo "$FAILURES"
  fi

  # Show transcript/output
  OUTPUT_TEXT=$(echo "$result" | jq -r '.output // .response // "no output"')

  if [[ "$SHORT_MODE" == "true" ]]; then
    # Show first and last 3 lines
    LINE_COUNT=$(echo "$OUTPUT_TEXT" | wc -l | tr -d ' ')
    if [[ "$LINE_COUNT" -gt 8 ]]; then
      echo ""
      echo "  Output (first 3 lines):"
      echo "$OUTPUT_TEXT" | head -3 | sed 's/^/    /'
      echo "    ... ($((LINE_COUNT - 6)) lines omitted) ..."
      echo "$OUTPUT_TEXT" | tail -3 | sed 's/^/    /'
    else
      echo ""
      echo "  Output:"
      echo "$OUTPUT_TEXT" | sed 's/^/    /'
    fi
  else
    echo ""
    echo "  Output:"
    echo "$OUTPUT_TEXT" | sed 's/^/    /'
  fi
done

echo ""
echo "============================================"
echo "  Done. Showed $( if [[ "$SHOW_ALL" == "true" ]]; then echo "all"; else echo "failed"; fi ) transcripts."
echo "============================================"
