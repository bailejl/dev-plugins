# Eval Taxonomy

Maps concepts from the [Anthropic "Demystifying Evals for AI Agents" article](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) to this repo's implementation.

## Concept Mapping

| Article Concept | This Repo's Implementation | Location |
|---|---|---|
| **Task** | Single test case in a suite YAML | `evals/<plugin>/suites/*.yaml` |
| **Trial** | One promptfoo run (one invocation of `npx promptfoo eval`) | `.promptfoo/output.json` |
| **Grader (code-based)** | Deterministic JavaScript assertions | `evals/<plugin>/graders/deterministic/*.js` |
| **Grader (model-based)** | LLM rubric markdown files | `evals/<plugin>/graders/llm-rubrics/*.md` |
| **Grader (transcript)** | Transcript analysis graders | `evals/<plugin>/graders/transcript/*.js` |
| **Transcript** | Promptfoo output parsed by transcript-viewer | `eval-infra/scripts/transcript-viewer.sh` |
| **pass@k** | Probability at least 1 of k trials passes | `eval-infra/scripts/compute-pass-at-k.py` |
| **pass^k** | Probability all k trials pass | `eval-infra/scripts/compute-pass-at-k.py` |
| **Capability eval** | Tests where agent discovers issues (starts at low pass rate) | `metadata.evalType: capability` |
| **Regression eval** | Tests that should always pass (maintain ~100%) | `metadata.evalType: regression` |
| **Reference solution** | Expected output proving a task is solvable | `evals/<plugin>/reference-solutions/` |
| **Fixture** | Realistic test input with planted issues | `evals/<plugin>/fixtures/` |

## Grader Layering

The article recommends layering graders from fast/cheap to slow/expensive. This repo implements three layers:

### Layer 1: Deterministic (fast, free)
Code-based checks that run instantly. Catch structural and format errors.

**Examples in this repo:**
- `report-structure.js` — Required sections exist (Summary, Findings, Recommendations)
- `score-arithmetic.js` — Weighted scores add up correctly
- `evidence-cited.js` — Findings cite file:line references
- `severity-accuracy.js` — Severity ratings match expected patterns
- `file-structure.js` — Generated files exist with required content

### Layer 2: LLM Rubric (slow, costly)
Model-based evaluation using calibrated rubrics. Catch quality and substance issues.

**Examples in this repo:**
- `finding-quality.md` — Are findings specific, evidenced, actionable?
- `false-positive.md` — Does the output fabricate issues?
- `coaching-quality.md` — Are recommendations prioritized and feasible?
- `react-quality.md` — Does generated code follow React best practices?

### Layer 3: Transcript (fast, free)
Analyze the agent's process, not just its output. Catch methodology issues.

**Examples in this repo:**
- `tool-usage.js` — Did the agent use the right tools?
- `evidence-gathering.js` — Did it gather evidence before drawing conclusions?

## Capability vs Regression Evals

Per the article: "Capability evals start at low pass rates. Regression evals maintain ~100%. Graduate saturated capability evals to regression."

### Capability Evals (`evalType: capability`)
- Positive test cases that check if the agent *discovers* issues
- Expected to start with moderate pass rates and improve over time
- Example: "Does the security audit find the SQL injection in insecure-repo?"

### Regression Evals (`evalType: regression`)
- Negative test cases and structural checks
- Expected to pass at ~100% consistently
- Example: "Does the audit produce zero false critical findings on clean-repo?"

### Graduating Evals
When a capability eval saturates (pass@1 ≈ 1.0 over multiple runs), graduate it to regression:
1. Change `evalType: capability` to `evalType: regression`
2. Set a strict pass threshold in CI
3. Any future regression triggers a CI failure

Track saturation using `compute-pass-at-k.py --group-by evalType`.

## Metrics Reference

| Metric | Formula | Use |
|---|---|---|
| **pass@1** | P(at least 1 of 1 passes) | How often does a single run succeed? |
| **pass@3** | 1 - C(n-c,3)/C(n,3) | If you run 3 trials, will at least one pass? |
| **pass@5** | 1 - C(n-c,5)/C(n,5) | Broader capability check |
| **pass^3** | (c/n)^3 | Probability all 3 trials pass (reliability) |
| **pass^5** | (c/n)^5 | Stricter reliability check |

Where `n` = total trials, `c` = passing trials.

Use pass@k for capability evals (can the agent do it at all?) and pass^k for regression evals (does it always do it?).
