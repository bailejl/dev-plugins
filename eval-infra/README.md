# eval-infra

Shared evaluation infrastructure for all plugin evals in this repo. Provides scripts, rubric templates, and grader utilities that individual plugin eval suites build on.

## Directory Layout

```
eval-infra/
├── promptfoo-base.yaml          # Base promptfoo config (all plugin evals extend this)
├── scripts/
│   ├── run-plugin-evals.sh      # Run evals for a single plugin
│   ├── run-all-evals.sh         # Run evals for every plugin
│   ├── compute-pass-at-k.py     # Compute pass@k and pass^k metrics
│   └── transcript-viewer.sh     # Quick-view failed transcripts
├── rubric-templates/
│   ├── code-quality-base.md     # Generic code quality rubric (1-5 scale)
│   ├── over-engineering-base.md # Over-engineering detection rubric
│   ├── instruction-following.md # Instruction-following rubric
│   └── report-quality.md        # Report structure/quality rubric
├── grader-lib/
│   ├── build-check.sh           # Deterministic: npm run build pass/fail
│   ├── lint-check.sh            # Deterministic: eslint pass/fail
│   ├── report-schema.js         # Validate report structure (md or JSON)
│   └── transcript-utils.js      # Parse and analyze promptfoo transcripts
└── README.md
```

## Quick Start

### Running evals

```bash
# Single plugin
./eval-infra/scripts/run-plugin-evals.sh frontend-dev

# All plugins
./eval-infra/scripts/run-all-evals.sh

# With verbose output
./eval-infra/scripts/run-plugin-evals.sh --verbose ai-readiness
```

### Computing pass@k metrics

After running evals, compute pass@k (optimistic — at least 1 of k passes) and pass^k (pessimistic — all k pass):

```bash
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/frontend-dev/.promptfoo/output.json \
  --k 1 3 5

# Group by suite
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/frontend-dev/.promptfoo/output.json \
  --k 1 5 --group-by suite

# JSON output
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/frontend-dev/.promptfoo/output.json \
  --k 1 3 5 --json
```

### Viewing failed transcripts

```bash
# Show all failures
./eval-infra/scripts/transcript-viewer.sh evals/frontend-dev/.promptfoo

# Short mode (first/last 3 lines per transcript)
./eval-infra/scripts/transcript-viewer.sh --short evals/ai-readiness/.promptfoo

# Filter by test name
./eval-infra/scripts/transcript-viewer.sh --test "scaffold" evals/frontend-dev/.promptfoo

# Just counts
./eval-infra/scripts/transcript-viewer.sh --count evals/frontend-dev/.promptfoo
```

## Base Config

`promptfoo-base.yaml` defines shared defaults that all plugin eval configs extend:

```yaml
# evals/frontend-dev/promptfooconfig.yaml
extends: ../../eval-infra/promptfoo-base.yaml

metadata:
  plugin: ../../plugins/frontend-dev

tests:
  - file://suites/scaffolding.yaml
  - file://suites/a11y.yaml
```

The base config provides:
- Default provider (Claude Sonnet) with temperature 0
- Output path settings (.promptfoo/output.json, .promptfoo/output.csv)
- Default timeout (5 minutes per test)
- Non-empty output assertion on every test
- Shared variables (`evalInfraRoot`, `graderLibRoot`, `rubricRoot`)

## Rubric Templates

LLM-as-judge rubrics for evaluating agent output. Each rubric scores criteria on a 1-5 scale with explicit level descriptions.

| Rubric | Use For |
|--------|---------|
| `code-quality-base.md` | Evaluating generated code (correctness, readability, maintainability, idiomatic usage, error handling) |
| `over-engineering-base.md` | Detecting over-engineering (unnecessary abstractions, premature optimization, over-configuration, excessive indirection) |
| `instruction-following.md` | Checking if the agent followed instructions (completeness, scope discipline, tool usage, output format) |
| `report-quality.md` | Evaluating report output (structure, evidence, actionability, completeness) |

### Using rubrics in eval configs

Reference rubrics in your promptfoo test assertions:

```yaml
assert:
  - type: llm-rubric
    value: file://../../eval-infra/rubric-templates/code-quality-base.md
```

Or extend a base rubric with plugin-specific criteria in your local `graders/llm-rubrics/` directory.

## Grader Library

### Deterministic graders

Shell scripts that return JSON `{"pass": true/false, "reason": "..."}`.

**build-check.sh** — Runs `npm install && npm run build` in a fixture:
```bash
./eval-infra/grader-lib/build-check.sh evals/frontend-dev/fixtures/base-app
# {"pass": true, "reason": "Build succeeded"}
```

**lint-check.sh** — Runs ESLint in a fixture:
```bash
./eval-infra/grader-lib/lint-check.sh evals/frontend-dev/fixtures/base-app
# {"pass": true, "reason": "No lint errors", "errorCount": 0, "warningCount": 0}
```

### Node.js utilities

**report-schema.js** — Validate report structure:
```js
const { validateReport } = require('../../eval-infra/grader-lib/report-schema');

// Markdown validation
const result = validateReport(markdownContent, {
  format: 'markdown',
  requiredSections: [
    { level: 1, pattern: 'Summary', hasContent: true },
    { level: 2, pattern: 'Findings', hasContent: true },
    { level: 2, pattern: 'Recommendations', hasContent: true },
  ],
  minLength: 500,
});
// { valid: true, errors: [] }

// JSON validation
const result = validateReport(jsonContent, {
  format: 'json',
  requiredFields: [
    { path: 'summary.score', type: 'number' },
    { path: 'findings', type: 'object' },
  ],
});
```

**transcript-utils.js** — Analyze agent transcripts:
```js
const {
  parseTranscript,
  countToolCalls,
  getToolSequence,
  findEvidence,
  getTurnCount,
} = require('../../eval-infra/grader-lib/transcript-utils');

const turns = parseTranscript(rawTranscript);

// Did the agent read files before editing?
const sequence = getToolSequence(turns);
const readBeforeEdit = sequence.indexOf('Read') < sequence.indexOf('Edit');

// How many tool calls?
const bashCount = countToolCalls(turns, 'Bash');

// Search for evidence in the transcript
const evidence = findEvidence(turns, /eslint|lint error/i);

// Total turns
const turnCount = getTurnCount(turns);
```
