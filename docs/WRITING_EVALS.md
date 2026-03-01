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

## Worked Example: Building an Eval from Scratch

This walks through creating a complete eval for a hypothetical `/security:dependency-audit` command that scans `package.json` for known vulnerable dependencies.

### Step 1: Design the Fixture

Create a fixture with 5 planted issues of varying severity:

```text
evals/security/fixtures/vulnerable-deps/
├── package.json          # Contains 5 vulnerable dependencies
├── package-lock.json     # Lock file with exact versions
└── src/
    └── index.js          # Simple app that uses the deps
```

**package.json** plants:
1. **Critical**: `lodash@4.17.11` — prototype pollution (CVE-2019-10744)
2. **Critical**: `express@4.16.0` — multiple known CVEs
3. **High**: `jsonwebtoken@8.3.0` — algorithm confusion vulnerability
4. **Medium**: `axios@0.19.0` — SSRF vulnerability
5. **Low**: `moment@2.24.0` — deprecated, ReDoS vulnerability

Document expected findings in a reference solution.

### Step 2: Create the Test Case YAML

```yaml
# evals/security/suites/dependency-audit.yaml
- description: "vulnerable-deps — detect 5 planted dependency vulnerabilities"
  vars:
    prompt: |
      Run /security:dependency-audit on the project at {{fixtureRoot}}/vulnerable-deps.
      Report all known vulnerable dependencies with CVE IDs and severity ratings.
    expectedFindings:
      - pattern: "lodash.*4\\.17\\.11|CVE-2019-10744|prototype.*pollution"
        severity: critical
      - pattern: "express.*4\\.16|CVE-\\d{4}-\\d+"
        severity: critical
      - pattern: "jsonwebtoken.*8\\.3|algorithm.*confus"
        severity: high
      - pattern: "axios.*0\\.19|SSRF"
        severity: medium
      - pattern: "moment.*deprecated|ReDoS"
        severity: low
  metadata:
    suite: dependency-audit
    evalType: capability
  assert:
    # Layer 1: Structural
    - type: javascript
      value: file://graders/deterministic/report-structure.js
      metric: report_structure
      weight: 1

    # Layer 1: Evidence — at least 50% of findings cite specifics
    - type: javascript
      value: file://graders/deterministic/evidence-cited.js
      metric: evidence_cited
      weight: 2

    # Layer 1: Severity accuracy — severity matches expected
    - type: javascript
      value: file://graders/deterministic/severity-accuracy.js
      metric: severity_accuracy
      weight: 2

    # Layer 2: Finding quality (LLM rubric)
    - type: llm-rubric
      value: file://graders/llm-rubrics/finding-quality.md
      metric: finding_quality
      weight: 2

    # Layer 2: Coaching quality
    - type: llm-rubric
      value: file://graders/llm-rubrics/coaching-quality.md
      metric: coaching_quality
      weight: 1
```

### Step 3: Write a Custom Deterministic Grader

For this eval, we want to check that the agent reports actual CVE IDs, not fabricated ones:

```javascript
// evals/security/graders/deterministic/cve-validator.js
module.exports = async function({ output }) {
  // Extract CVE references
  const cvePattern = /CVE-\d{4}-\d{4,}/g;
  const cves = [...new Set(output.match(cvePattern) || [])];

  if (cves.length === 0) {
    return { pass: false, score: 0, reason: 'No CVE IDs cited in output' };
  }

  // Known valid CVEs for our fixture
  const knownCVEs = [
    'CVE-2019-10744',  // lodash prototype pollution
    'CVE-2024-29041',  // express
    'CVE-2022-23529',  // jsonwebtoken
    'CVE-2020-28168',  // axios SSRF
    'CVE-2022-31129',  // moment ReDoS
  ];

  const valid = cves.filter(c => knownCVEs.includes(c));
  const invalid = cves.filter(c => !knownCVEs.includes(c));
  const ratio = valid.length / cves.length;

  return {
    pass: ratio >= 0.8 && invalid.length <= 1,
    score: ratio,
    reason: `${valid.length}/${cves.length} CVE IDs are valid. ${invalid.length > 0 ? `Unrecognized: ${invalid.join(', ')}` : ''}`,
  };
};
```

### Step 4: Run the Eval and Interpret pass@k

```bash
# Run 5 trials
for i in {1..5}; do npx promptfoo eval -c evals/security/promptfooconfig.yaml; done

# Compute metrics
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/security/.promptfoo/output.json \
  --k 1 3 5 \
  --group-by evalType

# Example output:
# === capability evals ===
# pass@1: 0.60  (3/5 trials passed)
# pass@3: 0.90  (high chance at least 1 of 3 passes)
# pass^3: 0.22  (low reliability — needs improvement)
```

**Interpreting the results:**
- **pass@1 = 0.60**: The agent finds the vulnerabilities 60% of the time — decent start for a capability eval
- **pass@3 = 0.90**: Running 3 trials gives 90% chance of at least one good result
- **pass^3 = 0.22**: Only 22% chance all 3 trials pass — the agent is inconsistent

### Step 5: Read a Transcript and Iterate

```bash
# View failed transcripts
./eval-infra/scripts/transcript-viewer.sh \
  --results evals/security/.promptfoo/output.json \
  --test "vulnerable-deps"
```

**Common failure patterns and fixes:**

| Transcript Pattern | Root Cause | Fix |
|---|---|---|
| Agent never reads package-lock.json | Prompt doesn't mention lock file | Add "Examine both package.json and package-lock.json" to prompt |
| Agent reports CVEs for wrong versions | Hallucination — didn't verify versions | Add hallucination-check.js grader |
| Agent misses low-severity issues | Focuses on critical only | Add false-negative.md rubric, weight medium/low findings |
| Agent fabricates CVE IDs | No grounding | Add cve-validator.js from Step 3 |

After each iteration, re-run and compare pass@k to your previous baseline.
