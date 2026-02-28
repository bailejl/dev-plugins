#!/usr/bin/env bash
# eval-infra/grader-lib/lint-check.sh
# Deterministic grader: runs eslint in a fixture directory.
# Returns JSON: {"pass": true/false, "reason": "...", "errorCount": N}
#
# Usage: ./lint-check.sh <fixture-directory> [--ext .js,.jsx,.ts,.tsx]

set -uo pipefail

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<EOF
Usage: $(basename "$0") <fixture-directory> [OPTIONS]

Run ESLint on the given fixture directory and return a JSON result.

Arguments:
  fixture-directory    Path to the project directory to lint

Options:
  --ext <extensions>   Comma-separated file extensions to lint
                       (default: .js,.jsx,.ts,.tsx)
  --max-warnings <n>   Maximum number of warnings before failing
                       (default: no limit, only errors cause failure)
  -h, --help           Show this help message

Output (stdout):
  {"pass": true, "reason": "No lint errors", "errorCount": 0, "warningCount": 0}
  {"pass": false, "reason": "3 lint errors found", "errorCount": 3, "warningCount": 1}

Exit codes:
  0    Always (result communicated via JSON)
EOF
  exit 0
fi

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
FIXTURE_DIR=""
EXTENSIONS=".js,.jsx,.ts,.tsx"
MAX_WARNINGS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) exec "$0" --help ;;
    --ext)
      if [[ $# -lt 2 ]]; then
        echo '{"pass": false, "reason": "--ext requires an argument"}'
        exit 0
      fi
      EXTENSIONS="$2"; shift 2
      ;;
    --max-warnings)
      if [[ $# -lt 2 ]]; then
        echo '{"pass": false, "reason": "--max-warnings requires an argument"}'
        exit 0
      fi
      MAX_WARNINGS="$2"; shift 2
      ;;
    -*)
      echo "{\"pass\": false, \"reason\": \"Unknown option: $1\"}"
      exit 0
      ;;
    *)
      if [[ -z "$FIXTURE_DIR" ]]; then
        FIXTURE_DIR="$1"; shift
      else
        echo "{\"pass\": false, \"reason\": \"Unexpected argument: $1\"}"
        exit 0
      fi
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Validate
# ---------------------------------------------------------------------------
if [[ -z "$FIXTURE_DIR" ]]; then
  echo '{"pass": false, "reason": "No fixture directory provided", "errorCount": 0, "warningCount": 0}'
  exit 0
fi

if [[ ! -d "$FIXTURE_DIR" ]]; then
  echo "{\"pass\": false, \"reason\": \"Directory not found: $FIXTURE_DIR\", \"errorCount\": 0, \"warningCount\": 0}"
  exit 0
fi

# ---------------------------------------------------------------------------
# Run ESLint
# ---------------------------------------------------------------------------
cd "$FIXTURE_DIR"

# Use JSON formatter for structured output
LINT_JSON=$(npx eslint --format json --ext "$EXTENSIONS" . 2>/dev/null || true)

if [[ -z "$LINT_JSON" ]]; then
  # ESLint produced no output — might not be configured
  echo '{"pass": true, "reason": "ESLint produced no output (no files matched or no config)", "errorCount": 0, "warningCount": 0}'
  exit 0
fi

# Parse ESLint JSON output
ERROR_COUNT=$(echo "$LINT_JSON" | node -e "
  let data = '';
  process.stdin.on('data', d => data += d);
  process.stdin.on('end', () => {
    try {
      const results = JSON.parse(data);
      const total = results.reduce((acc, r) => acc + r.errorCount, 0);
      console.log(total);
    } catch {
      console.log(-1);
    }
  });
")

WARNING_COUNT=$(echo "$LINT_JSON" | node -e "
  let data = '';
  process.stdin.on('data', d => data += d);
  process.stdin.on('end', () => {
    try {
      const results = JSON.parse(data);
      const total = results.reduce((acc, r) => acc + r.warningCount, 0);
      console.log(total);
    } catch {
      console.log(-1);
    }
  });
")

# Handle parse failures
if [[ "$ERROR_COUNT" == "-1" || "$WARNING_COUNT" == "-1" ]]; then
  ESCAPED=$(echo "$LINT_JSON" | head -5 | tr '\n' ' ' | sed 's/"/\\"/g' | cut -c1-300)
  echo "{\"pass\": false, \"reason\": \"Failed to parse ESLint output: $ESCAPED\", \"errorCount\": 0, \"warningCount\": 0}"
  exit 0
fi

# Determine pass/fail
PASS=true
REASON="No lint errors"

if [[ "$ERROR_COUNT" -gt 0 ]]; then
  PASS=false
  REASON="$ERROR_COUNT lint error(s) found"
fi

if [[ -n "$MAX_WARNINGS" && "$WARNING_COUNT" -gt "$MAX_WARNINGS" ]]; then
  PASS=false
  REASON="$ERROR_COUNT error(s) and $WARNING_COUNT warning(s) found (max warnings: $MAX_WARNINGS)"
fi

echo "{\"pass\": $PASS, \"reason\": \"$REASON\", \"errorCount\": $ERROR_COUNT, \"warningCount\": $WARNING_COUNT}"
