# Grader Guide

How to use and write graders for plugin evals. Graders are the assertion layer — they determine whether an agent's output passes or fails a test case.

## Grader Types

There are three categories of graders, each catching different failure modes:

| Type | Speed | What it catches | False positive risk |
|------|-------|----------------|-------------------|
| **Deterministic** | Fast | Format errors, build failures, lint errors, missing sections | Low |
| **LLM Rubric** | Slow | Quality issues, accuracy, hallucination, over-engineering | Medium |
| **Transcript** | Fast | Process errors (wrong tools, no evidence gathering, thrashing) | Low |

Use all three together. Deterministic graders are your first line of defense, LLM rubrics assess quality, and transcript graders verify the agent's process.

## Deterministic Graders

### Built-in promptfoo assertions

```yaml
assert:
  # String presence
  - type: contains
    value: "## Summary"

  # String absence
  - type: not-contains
    value: "undefined"

  # Regex match
  - type: regex
    value: "Score:\\s+\\d+/100"

  # Custom JavaScript (inline)
  - type: javascript
    value: "output.split('\\n').length > 10"

  # Custom JavaScript (file)
  - type: javascript
    value: file://graders/deterministic/my-check.js
```

### Shared deterministic graders

These live in `eval-infra/grader-lib/` and are available to all plugin evals.

#### build-check.sh

Runs `npm install && npm run build` in a fixture directory. Use for commands that generate or modify code.

```bash
./eval-infra/grader-lib/build-check.sh path/to/fixture
# {"pass": true, "reason": "Build succeeded"}
# {"pass": false, "reason": "Build failed: Module not found..."}
```

In a promptfoo assertion:

```yaml
assert:
  - type: javascript
    value: |
      const { execSync } = require('child_process');
      const result = JSON.parse(
        execSync('./eval-infra/grader-lib/build-check.sh evals/frontend-dev/fixtures/base-app').toString()
      );
      return result.pass;
```

#### lint-check.sh

Runs ESLint in a fixture directory. Returns error and warning counts.

```bash
./eval-infra/grader-lib/lint-check.sh path/to/fixture
# {"pass": true, "reason": "No lint errors", "errorCount": 0, "warningCount": 0}
```

Options:
- `--ext .js,.jsx,.ts,.tsx` — file extensions to lint
- `--max-warnings 5` — fail if warnings exceed threshold

#### report-schema.js

Validates that a report has the required structure.

```js
const { validateReport } = require('../../eval-infra/grader-lib/report-schema');

// Markdown validation
const result = validateReport(output, {
  format: 'markdown',
  requiredSections: [
    { level: 1, pattern: 'Audit Report', hasContent: true },
    { level: 2, pattern: 'Summary', hasContent: true },
    { level: 2, pattern: 'Findings', hasContent: true },
    { level: 2, pattern: 'Recommendations', hasContent: true },
  ],
  minLength: 500,
});

// JSON validation
const result = validateReport(output, {
  format: 'json',
  requiredFields: [
    { path: 'score', type: 'number' },
    { path: 'findings', type: 'object' },
    { path: 'summary.verdict', type: 'string' },
  ],
});

// result = { valid: true, errors: [] }
// result = { valid: false, errors: ["Missing required heading: ..."] }
```

### Writing custom deterministic graders

Create a file in `evals/<plugin>/graders/deterministic/`:

```js
// graders/deterministic/score-arithmetic.js
// Checks that reported scores add up correctly

/**
 * @param {string} output - The agent's output
 * @returns {boolean} - Whether the assertion passes
 */
module.exports = function(output) {
  const scoreRegex = /(\w+):\s+(\d+)\/100/g;
  const scores = {};
  let match;

  while ((match = scoreRegex.exec(output)) !== null) {
    scores[match[1]] = parseInt(match[2], 10);
  }

  const totalMatch = output.match(/Overall:\s+(\d+)\/100/);
  if (!totalMatch) return false;

  const reportedTotal = parseInt(totalMatch[1], 10);
  const values = Object.values(scores);
  if (values.length === 0) return false;

  const computedAvg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return Math.abs(reportedTotal - computedAvg) <= 2; // Allow rounding tolerance
};
```

Reference it in your test suite:

```yaml
assert:
  - type: javascript
    value: file://graders/deterministic/score-arithmetic.js
```

## LLM Rubric Graders

LLM rubrics use an LLM judge to evaluate output quality. They're essential for assessing things that can't be checked deterministically — like whether findings are specific and actionable.

### Using shared rubric templates

The shared templates live in `eval-infra/rubric-templates/`:

| Template | Best for |
|----------|----------|
| `code-quality-base.md` | Commands that generate code |
| `over-engineering-base.md` | Commands that generate or refactor code |
| `instruction-following.md` | Any command (did it follow the prompt?) |
| `report-quality.md` | Commands that produce reports/audits |

```yaml
assert:
  - type: llm-rubric
    value: file://../../eval-infra/rubric-templates/code-quality-base.md
```

### Writing plugin-specific rubrics

Create rubrics in `evals/<plugin>/graders/llm-rubrics/`:

```markdown
# React Component Quality Rubric

Evaluate the generated React component. Score each criterion 1-5.

## 1. Hooks Usage (weight: 30%)
| Score | Description |
|-------|-------------|
| 1 | Misuses hooks (conditional calls, wrong dependencies) |
| 3 | Correct but not optimal hook usage |
| 5 | Expert hook usage with proper memoization and deps |

## 2. Component API (weight: 30%)
...

## Output Format
```
hooks_usage: <score>/5 — <justification>
component_api: <score>/5 — <justification>
weighted_total: <computed>/5
pass: <true|false>
```
```

### Rubric writing tips

- Be explicit about what each score level means — don't leave room for interpretation
- Use weighted scores so the judge knows what matters most
- Specify the output format so you can parse the judge's response
- Calibrate by scoring outputs yourself first, then comparing to the judge

## Transcript Graders

Transcript graders check the agent's process — what tools it used, in what order, and whether it gathered evidence before drawing conclusions.

### Using transcript-utils.js

```js
const {
  parseTranscript,
  countToolCalls,
  getToolSequence,
  findEvidence,
  getTurnCount,
} = require('../../eval-infra/grader-lib/transcript-utils');
```

### Common transcript checks

#### Read before write

```yaml
assert:
  - type: javascript
    value: |
      const { getToolSequence } = require('../../eval-infra/grader-lib/transcript-utils');
      const tools = getToolSequence(output);
      const firstRead = tools.indexOf('Read');
      const firstEdit = tools.indexOf('Edit');
      // Must read at least once, and before any edit
      return firstRead >= 0 && (firstEdit < 0 || firstRead < firstEdit);
```

#### Evidence before conclusion

```yaml
assert:
  - type: javascript
    value: |
      const { getToolSequence } = require('../../eval-infra/grader-lib/transcript-utils');
      const tools = getToolSequence(output);
      // Agent should use search/read tools before producing final output
      const searchTools = tools.filter(t => ['Read', 'Grep', 'Glob', 'Bash'].includes(t));
      return searchTools.length >= 3;
```

#### Reasonable turn count

```yaml
assert:
  - type: javascript
    value: |
      const { getTurnCount } = require('../../eval-infra/grader-lib/transcript-utils');
      const turns = getTurnCount(output);
      // Should complete in a reasonable number of turns
      return turns >= 3 && turns <= 30;
```

#### Specific tool usage

```yaml
assert:
  - type: javascript
    value: |
      const { countToolCalls } = require('../../eval-infra/grader-lib/transcript-utils');
      // For git-health command, agent should inspect git history
      const gitCalls = countToolCalls(output, 'Bash');
      return gitCalls >= 2;
```

### Writing custom transcript graders

```js
// graders/transcript/evidence-gathering.js
// Checks that the agent gathered evidence before producing findings

const { getToolSequence, findEvidence } = require('../../eval-infra/grader-lib/transcript-utils');

module.exports = function(output) {
  const tools = getToolSequence(output);

  // Must use Read or Grep at least 3 times
  const reads = tools.filter(t => t === 'Read' || t === 'Grep');
  if (reads.length < 3) return false;

  // Must have evidence patterns in the output
  const evidence = findEvidence(output, /\w+\.\w+:\d+/); // file:line references
  return evidence.length >= 2;
};
```

## Combining Graders

A well-tested command uses all three grader types together:

```yaml
# suites/code-review.yaml
- description: "code-review finds planted issues in messy-repo"
  vars:
    fixture: "../fixtures/messy-repo"
  assert:
    # Layer 1: Deterministic — structural checks
    - type: contains
      value: "## Findings"
    - type: javascript
      value: file://../../eval-infra/grader-lib/report-schema.js
      # (wrapped in a function that calls validateReport)

    # Layer 2: Transcript — process checks
    - type: javascript
      value: |
        const { getToolSequence } = require('../../eval-infra/grader-lib/transcript-utils');
        const tools = getToolSequence(output);
        return tools.filter(t => t === 'Read' || t === 'Grep').length >= 3;

    # Layer 3: LLM rubric — quality checks
    - type: llm-rubric
      value: file://../../eval-infra/rubric-templates/report-quality.md
    - type: llm-rubric
      value: file://graders/llm-rubrics/finding-quality.md
```

## Grader File Organization

```
evals/<plugin>/graders/
├── deterministic/        # Fast, code-based checks
│   ├── score-arithmetic.js
│   ├── evidence-cited.js
│   └── file-structure.js
├── llm-rubrics/          # LLM-as-judge rubrics
│   ├── finding-quality.md
│   ├── coaching-quality.md
│   └── false-positive.md
└── transcript/           # Agent behavior checks
    ├── tool-usage.js
    └── evidence-gathering.js
```

Keep deterministic graders fast and specific. Use LLM rubrics for nuanced quality. Use transcript graders for process verification. Together, they catch the failure modes that any single grader type would miss.
