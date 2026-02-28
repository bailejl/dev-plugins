# Writing Evals

How to create eval suites that test your plugin commands rigorously.

## Architecture

```
evals/<plugin-name>/
├── promptfooconfig.yaml          # Extends eval-infra/promptfoo-base.yaml
├── suites/
│   ├── <command>.yaml            # Positive test cases
│   └── <command>-neg.yaml        # Negative / adversarial test cases
├── graders/
│   ├── deterministic/            # Code-based pass/fail checks
│   ├── llm-rubrics/              # LLM-as-judge rubrics
│   └── transcript/               # Agent behavior checks
├── fixtures/                     # Test input projects/repos
├── reference-solutions/          # Gold-standard expected outputs
└── source-prompts/               # Original prompt docs (ai-readiness only)
```

Every plugin eval config extends the shared base:

```yaml
# evals/my-plugin/promptfooconfig.yaml
extends: ../../eval-infra/promptfoo-base.yaml
```

This gives you default provider settings, timeouts, output paths, and shared variables.

## Writing Test Suites

Test suites live in `suites/` as YAML files. Each file contains test cases for one command.

### Basic test case

```yaml
# suites/my-command.yaml
- description: "my-command generates correct output for simple input"
  vars:
    command: "/my-plugin:my-command"
    fixture: "../fixtures/simple-project"
  assert:
    # Deterministic: output contains expected content
    - type: contains
      value: "## Summary"
    # LLM rubric: quality assessment
    - type: llm-rubric
      value: file://../../eval-infra/rubric-templates/code-quality-base.md
    # Custom grader
    - type: javascript
      value: file://graders/deterministic/my-check.js
```

### Test case fields

| Field | Required | Description |
|-------|:--------:|-------------|
| `description` | Yes | Human-readable test name |
| `vars` | Yes | Variables passed to the prompt template |
| `assert` | Yes | Array of assertions to check |
| `metadata.suite` | No | Suite name for grouping in pass@k |
| `threshold` | No | Minimum score to pass (0-1) |

### Positive vs. negative suites

**Positive suites** (`command.yaml`) test that the agent does the right thing:
- Finds real issues in intentionally broken fixtures
- Produces correct output format
- Uses appropriate tools

**Negative suites** (`command-neg.yaml`) test that the agent doesn't do the wrong thing:
- Does NOT report false positives on clean code
- Does NOT over-engineer the solution
- Does NOT hallucinate findings without evidence
- Stays within scope

```yaml
# suites/code-review-neg.yaml
- description: "code-review should not flag clean code"
  vars:
    fixture: "../fixtures/clean-repo"
  assert:
    - type: not-contains
      value: "critical"
    - type: llm-rubric
      value: |
        The agent should report that the code is generally clean.
        It should NOT fabricate issues or report false positives.
        Score 1 if false positives are present, 5 if the review is accurate.
```

## Creating Fixtures

Fixtures are test input projects that the agent operates on. Design them to exercise specific behaviors.

### Fixture design principles

1. **Plant specific issues** — each fixture should have known, countable problems
2. **Document what's planted** — keep a comment or README listing expected findings
3. **Keep fixtures minimal** — just enough code to trigger the behavior you're testing
4. **Use realistic code** — not toy examples, but small real-world patterns

### Example fixture structure

```
fixtures/
├── base-app/              # Clean, working project
│   ├── package.json
│   ├── src/
│   └── .eslintrc.json
├── broken-a11y/           # Accessibility violations planted
│   └── src/
│       └── BadForm.jsx    # Missing labels, no keyboard nav
└── messy-component/       # Over-complex component
    └── src/
        └── MonolithDashboard.jsx  # 500+ lines, mixed concerns
```

### Tips for fixture design

- For **code generation** commands (scaffold, refactor): provide a starting project the agent modifies
- For **audit** commands (code-review, security): plant known issues and verify they're found
- For **negative tests**: provide clean code and verify no false positives

## Writing Assertions

### Built-in assertion types

| Type | Description | Example |
|------|-------------|---------|
| `contains` | Output contains string | `value: "## Summary"` |
| `not-contains` | Output does not contain string | `value: "undefined"` |
| `javascript` | Custom JS function returns true | `value: "output.length > 100"` |
| `llm-rubric` | LLM judges output against rubric | `value: file://rubric.md` |
| `regex` | Output matches regex | `value: "score:\\s+\\d+/100"` |

### Custom JavaScript assertions

```yaml
assert:
  - type: javascript
    value: |
      // Must return true (pass) or false (fail)
      const lines = output.split('\n');
      const hasTitle = lines[0].startsWith('# ');
      const hasSummary = output.includes('## Summary');
      return hasTitle && hasSummary;
```

### Using shared grader utilities

```yaml
assert:
  - type: javascript
    value: |
      const { validateReport } = require('../../eval-infra/grader-lib/report-schema');
      const result = validateReport(output, {
        format: 'markdown',
        requiredSections: [
          { level: 1, pattern: 'Audit Report', hasContent: true },
          { level: 2, pattern: 'Summary', hasContent: true },
          { level: 2, pattern: 'Findings', hasContent: true },
        ],
        minLength: 500,
      });
      return result.valid;
```

### Using transcript graders

```yaml
assert:
  - type: javascript
    value: |
      const { getToolSequence, countToolCalls } = require('../../eval-infra/grader-lib/transcript-utils');
      const tools = getToolSequence(output);
      // Agent should read files before editing
      const readIdx = tools.indexOf('Read');
      const editIdx = tools.indexOf('Edit');
      return readIdx >= 0 && (editIdx < 0 || readIdx < editIdx);
```

## Reference Solutions

Place gold-standard outputs in `reference-solutions/`. These serve as:

1. **Calibration targets** — what a perfect response looks like
2. **LLM grading anchors** — the LLM judge can compare agent output against reference
3. **Documentation** — show contributors what quality output looks like

```yaml
assert:
  - type: llm-rubric
    value: |
      Compare the agent's output to this reference solution.
      The agent does not need to match word-for-word, but should
      cover the same findings and reach similar conclusions.

      Reference: {{file "reference-solutions/clean-repo-audit.md"}}
```

## Running and Iterating

```bash
# Run your plugin's evals
./eval-infra/scripts/run-plugin-evals.sh my-plugin

# View results in browser
npx promptfoo view -d evals/my-plugin/.promptfoo

# Check failed transcripts
./eval-infra/scripts/transcript-viewer.sh evals/my-plugin/.promptfoo

# Compute pass@k
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/my-plugin/.promptfoo/output.json \
  --k 1 3 5 --group-by suite
```

### Iteration workflow

1. **Start with 5 tests** — 3 positive, 2 negative
2. **Run evals, read transcripts** — understand what the agent actually does
3. **Adjust the command prompt** — improve instructions based on failures
4. **Add graders** — tighten assertions based on observed failure modes
5. **Expand to 20+ tests** — cover more edge cases and command combinations
6. **Track pass@k over time** — measure improvement

## Balanced Test Suites

Aim for a balance across these dimensions:

| Dimension | Examples |
|-----------|---------|
| **Positive / Negative** | Finds real issues / Doesn't hallucinate issues |
| **Simple / Complex** | Small file / Large monorepo |
| **Happy path / Edge case** | Standard React app / Unusual framework setup |
| **Individual commands / Agent** | Single command / Multi-command agent workflow |

A good starting ratio: 60% positive, 40% negative.
