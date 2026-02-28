#!/usr/bin/env bash
# eval-infra/grader-lib/build-check.sh
# Deterministic grader: runs npm run build in a fixture directory.
# Returns JSON: {"pass": true/false, "reason": "..."}
#
# Usage: ./build-check.sh <fixture-directory>

set -uo pipefail

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<EOF
Usage: $(basename "$0") <fixture-directory>

Run npm install && npm run build in the given fixture directory.
Returns a JSON result indicating pass/fail.

Arguments:
  fixture-directory    Path to the project directory containing package.json

Output (stdout):
  {"pass": true, "reason": "Build succeeded"}
  {"pass": false, "reason": "Build failed: <error details>"}

Exit codes:
  0    Always (result communicated via JSON)
EOF
  exit 0
fi

# ---------------------------------------------------------------------------
# Validate arguments
# ---------------------------------------------------------------------------
FIXTURE_DIR="${1:-}"

if [[ -z "$FIXTURE_DIR" ]]; then
  echo '{"pass": false, "reason": "No fixture directory provided"}'
  exit 0
fi

if [[ ! -d "$FIXTURE_DIR" ]]; then
  echo "{\"pass\": false, \"reason\": \"Directory not found: $FIXTURE_DIR\"}"
  exit 0
fi

if [[ ! -f "$FIXTURE_DIR/package.json" ]]; then
  echo "{\"pass\": false, \"reason\": \"No package.json found in $FIXTURE_DIR\"}"
  exit 0
fi

# Check that a build script exists
BUILD_SCRIPT=$(node -e "
  const pkg = require('$FIXTURE_DIR/package.json');
  console.log(pkg.scripts && pkg.scripts.build ? 'yes' : 'no');
" 2>/dev/null)

if [[ "$BUILD_SCRIPT" != "yes" ]]; then
  echo "{\"pass\": false, \"reason\": \"No build script defined in package.json\"}"
  exit 0
fi

# ---------------------------------------------------------------------------
# Run install + build
# ---------------------------------------------------------------------------
cd "$FIXTURE_DIR"

# Install dependencies
INSTALL_OUTPUT=$(npm install 2>&1)
INSTALL_EXIT=$?

if [[ $INSTALL_EXIT -ne 0 ]]; then
  # Escape special characters for JSON
  ESCAPED=$(echo "$INSTALL_OUTPUT" | tail -5 | tr '\n' ' ' | sed 's/"/\\"/g' | cut -c1-500)
  echo "{\"pass\": false, \"reason\": \"npm install failed: $ESCAPED\"}"
  exit 0
fi

# Run build
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [[ $BUILD_EXIT -eq 0 ]]; then
  echo '{"pass": true, "reason": "Build succeeded"}'
else
  ESCAPED=$(echo "$BUILD_OUTPUT" | tail -10 | tr '\n' ' ' | sed 's/"/\\"/g' | cut -c1-500)
  echo "{\"pass\": false, \"reason\": \"Build failed: $ESCAPED\"}"
fi
