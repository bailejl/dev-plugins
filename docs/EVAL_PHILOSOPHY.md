# Eval Philosophy

Principles for building reliable, meaningful evals for Claude Code plugins.

## Why Eval-Driven Development?

Plugin commands are prompts. Prompts are fragile — a word change can flip behavior. Without evals, you're flying blind:

- You don't know if a prompt edit improved or regressed quality
- You can't tell if the agent follows instructions consistently
- You can't measure reliability across different inputs

Evals turn prompt development from guesswork into engineering.

## Core Principles

### 1. Eval what matters, not what's easy

It's tempting to write evals that check surface-level things: "does the output contain the word 'Summary'?" That's a start, but it doesn't tell you if the summary is correct.

Layer your assertions:

| Layer | What it checks | Example |
|-------|---------------|---------|
| **Structural** | Output format, required sections | `contains: "## Findings"` |
| **Deterministic** | Specific factual claims, calculations | Build passes, lint clean, score arithmetic |
| **Behavioral** | Agent used the right process | Read before edit, evidence before conclusion |
| **Semantic** | Output quality and accuracy | LLM rubric: "Are findings specific and actionable?" |

Each layer catches different failure modes. A structurally correct report can still have bad findings.

### 2. Negative tests are as important as positive tests

A code review that flags everything is useless. A security audit that cries wolf erodes trust. Negative tests guard against:

- **False positives** — reporting issues that don't exist
- **Over-engineering** — adding unnecessary complexity
- **Scope creep** — doing more than asked
- **Hallucination** — fabricating evidence

For every positive fixture with planted issues, create a clean fixture and verify the agent doesn't fabricate findings.

### 3. Test the process, not just the output

An agent can stumble into a correct answer by luck. Transcript graders check that the agent followed a sound process:

- Did it read relevant files before drawing conclusions?
- Did it use search tools to find evidence?
- Did it use the right tools for the job?
- Was the turn count reasonable (not thrashing)?

A good process with a mediocre output is more trustworthy than a lucky good output from a bad process.

### 4. Use pass@k, not single-run pass rates

LLM outputs are stochastic. A single run tells you little about reliability. Run each test k times and compute:

- **pass@k** — probability that at least 1 of k runs passes (optimistic, measures capability)
- **pass^k** — probability that all k runs pass (pessimistic, measures reliability)

For production readiness, care about pass^k. A command with pass@5 = 95% but pass^5 = 40% is capable but unreliable.

```bash
python eval-infra/scripts/compute-pass-at-k.py \
  --results evals/frontend-dev/.promptfoo/output.json \
  --k 1 3 5
```

### 5. Fixtures should be realistic and documented

Avoid toy fixtures. Plant real-world issues:

- Don't just omit an `alt` attribute — create a form with multiple accessibility violations that interact
- Don't just leave one `console.log` — create a component with real complexity problems
- Don't just have one insecure endpoint — create a repo with realistic security debt

Document what's planted in each fixture. If you can't enumerate the expected findings, your graders can't check for them.

### 6. Calibrate LLM rubrics against your own judgment

LLM-as-judge rubrics are powerful but need calibration:

1. Run the eval and collect agent outputs
2. Score 10-20 outputs yourself using the rubric
3. Compare your scores to the LLM judge's scores
4. Adjust rubric wording where there's disagreement
5. Repeat until your scores and the judge's converge

The rubric should produce scores you'd agree with. If it doesn't, the rubric needs editing, not the agent.

### 7. Iterate in small cycles

Don't write 50 tests and then run them all. The feedback loop should be tight:

1. Write 3-5 tests
2. Run them
3. Read the full transcripts (not just pass/fail)
4. Understand failure modes
5. Improve the command prompt or graders
6. Repeat

You learn more from reading 5 transcripts carefully than from glancing at 50 pass/fail results.

## Grader Selection Guide

| When you need to check... | Use this grader type |
|---------------------------|---------------------|
| Output contains specific text | `contains` / `not-contains` |
| Output matches a format | `regex` or `javascript` |
| Code builds or lints | `eval-infra/grader-lib/build-check.sh` or `lint-check.sh` |
| Report has required sections | `eval-infra/grader-lib/report-schema.js` |
| Agent followed correct process | `eval-infra/grader-lib/transcript-utils.js` |
| Output quality / accuracy | `llm-rubric` with rubric template |
| No false positives | `llm-rubric` with negative-focused rubric |

See [Grader Guide](GRADER_GUIDE.md) for implementation details.

## Metrics to Track

| Metric | What it tells you | Target |
|--------|------------------|--------|
| pass@1 | Single-run success rate | > 80% |
| pass@5 | Capability ceiling | > 95% |
| pass^5 | Reliability floor | > 60% |
| Negative suite pass rate | False positive rate | > 90% |
| Mean turn count | Efficiency | Decreasing over time |
| Mean grader score | Quality trend | Increasing over time |

## Anti-Patterns to Avoid

**Eval theater** — writing tests that always pass. If your pass rate is 100%, your tests are too easy.

**Output anchoring** — testing for exact output strings. Agent output varies; test for semantic properties.

**Grader gap** — deterministic graders catch format issues but miss quality. LLM rubrics catch quality but miss format. Use both.

**Fixture monoculture** — testing only one kind of input. Vary project size, language, framework, and messiness level.

**Ignoring transcripts** — pass/fail tells you what happened. Transcripts tell you why. Read them.

## Case Sourcing

Every eval case must declare its origin via `source` in the metadata block. This enables tracking where cases come from and measuring how well the eval suite reflects real-world usage.

### Accepted `source` values

| Value | Meaning |
|-------|---------|
| `ai-generated` | Case was created by an AI (Claude) during initial eval development |
| `production-failure` | Case reproduces a real bug, false positive, or false negative observed in production usage |
| `user-report` | Case based on a user-reported issue or feedback |
| `manual` | Case manually authored by a human developer |

### Current status

All existing eval cases are `source: ai-generated`. This is a known gap — the suite does not yet include cases sourced from real user behavior.

### Adding real-world cases

When a plugin produces an incorrect result in real usage (false positive, false negative, missed finding, or hallucinated finding):

1. Create a new eval case in the appropriate suite file under `evals/<plugin>/suites/`
2. Set `source: "production-failure"` (or `user-report` if from feedback)
3. Add a `sourceNotes` field describing the original incident:
   ```yaml
   metadata:
     suite: code-review
     case: missed-xss-in-template
     evalType: capability
     source: production-failure
     sourceNotes: "Plugin missed XSS vulnerability in Handlebars template during audit of project-X on 2025-01-15"
   ```
4. Use the real (or minimally anonymized) code as the fixture
5. Write graders that assert the correct behavior

Production-sourced cases are the highest-value additions to the eval suite.

## Contributing Evals

### Adding a new eval suite

1. Create a YAML file in `evals/<plugin>/suites/<suite-name>.yaml`
2. Each test case must include these metadata fields:
   ```yaml
   metadata:
     suite: <suite-name>        # matches the filename
     case: <case-name>          # unique identifier within the suite
     evalType: capability       # or "regression"
     source: ai-generated       # see Case Sourcing section for values
   ```
3. Define `vars` with a `fixture` path and `prompt`
4. Add `assert` blocks with graders (see below)
5. Create a corresponding negative suite (`<suite-name>-neg.yaml`) to test for false positives

### Adding a new grader

Three grader types are available:

**Deterministic graders** — JavaScript functions that check output for specific patterns:
```yaml
- type: javascript
  value: |
    const text = output || '';
    return /expected-pattern/.test(text);
  metric: my_metric
  weight: 2
```

**Transcript graders** — check the agent's process (tool usage, file reads, turn count):
```yaml
- type: javascript
  value: file://./graders/transcript/evidence-gathering.js
  metric: evidence_gathering
  weight: 2
```

**LLM rubric graders** — use an LLM judge to assess output quality:
```yaml
- type: llm-rubric
  value: |
    Evaluate the report for completeness and accuracy...
  metric: report_quality
  weight: 3
```

Place reusable grader scripts in `evals/<plugin>/graders/` organized by type (`deterministic/`, `transcript/`, `llm-rubrics/`).

### Required metadata fields

Every test case **must** have:
- `suite` — name matching the YAML filename
- `case` — unique case identifier
- `evalType` — `capability` (positive tests) or `regression` (negative tests)
- `source` — origin of the test case (see Case Sourcing above)

### Validation

Validate your plugin's eval structure before submitting:

```bash
./eval-infra/scripts/validate-plugin.sh <plugin>
```

This checks for required files, metadata fields, grader references, and fixture paths.

### Recording baselines

After running evals, record the results as the new baseline:

```bash
npm run eval:all
./eval-infra/scripts/record-baseline.sh <plugin>
```

This updates `BASELINE.md` and appends a timestamped entry to `evals/<plugin>/eval-history.jsonl`.
