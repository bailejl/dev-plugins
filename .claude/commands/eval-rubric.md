---
description: Assess eval infrastructure alignment with Anthropic's agent eval best practices — 12 dimensions scored against "Demystifying Evals for AI Agents"
---

# Eval Infrastructure Rubric Assessment

You are an eval infrastructure assessor. Your job is to score this repository's evaluation infrastructure against the 12 dimensions from Anthropic's ["Demystifying Evals for AI Agents"](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) article. The minimum target is **3/5 on every dimension**.

---

## Evidence Gathering

Before scoring any dimension, read the relevant files. Do not guess — every score must be backed by evidence from the actual files in this repo.

```
# Test suites — count, metadata, pos/neg balance
glob evals/*/suites/*.yaml

# Read a sample of suite files to check metadata fields, case count, expectedFindings
# Read at least one positive and one negative suite per plugin

# Graders — types present
glob evals/*/graders/**/*
glob evals/*/graders/deterministic/*.js
glob evals/*/graders/transcript/*.js
glob evals/*/graders/llm-rubrics/*.md

# Reference solutions
glob evals/*/reference-solutions/*

# Fixtures — realism and documentation
glob evals/*/fixtures/**/*

# Eval infra config
read eval-infra/promptfoo-base.yaml

# Run scripts and metrics tooling
glob eval-infra/scripts/*

# Baseline tracking
read BASELINE.md

# Eval history
glob evals/*/eval-history.jsonl

# CI integration
read .github/workflows/eval-ci.yaml

# Philosophy and docs
read docs/EVAL_PHILOSOPHY.md

# Ownership
read CODEOWNERS

# Plugin validation
glob eval-infra/scripts/validate-plugin.sh
```

Read these files and gather specific counts, patterns, and evidence before proceeding to scoring.

---

## Scoring Dimensions

Score each dimension from **0 to 5** using the criteria below. Cite specific files and evidence for every score.

---

### Dimension 1: Start Early with Real Failures
**Article reference**: Step 0 — "Start building evals from day one using real failures"

**What to look for**:
- Number of test suites in `evals/*/suites/`
- Whether fixtures contain realistic, planted issues (not toy problems)
- Whether suites trace to real failure scenarios

**Scoring**:
- **0**: No eval suites exist
- **1**: 1–2 suites with trivial/toy test cases
- **2**: Multiple suites but fixtures are synthetic or unrealistic
- **3**: Suites across multiple plugins with realistic fixtures containing planted issues
- **4**: Comprehensive suites with documented failure provenance, realistic fixture variety
- **5**: Extensive suites clearly traced to real-world failures, fixtures indistinguishable from production code

---

### Dimension 2: Source from Real User Behavior
**Article reference**: Step 1 — "Source eval cases from real user interactions"

**What to look for**:
- `metadata.source` fields in suite YAML files
- Provenance documentation for test cases
- Evidence that cases came from real usage vs invented scenarios

**Scoring**:
- **0**: No metadata or provenance tracking
- **1**: Metadata exists but no source field
- **2**: Source fields present but all say "manual" or "synthetic"
- **3**: Some test cases have real-world sourcing documented; metadata schema includes source
- **4**: Majority of cases have real-world provenance; documented collection process
- **5**: Systematic real-world sourcing pipeline; production failure → eval case workflow documented

---

### Dimension 3: Unambiguous Tasks + Reference Solutions
**Article reference**: Step 2 — "Tasks should have clear success criteria and reference solutions"

**What to look for**:
- Reference solutions in `evals/*/reference-solutions/`
- `expectedFindings` or similar fields in suite YAML
- Clarity and detail of reference outputs

**Scoring**:
- **0**: No reference solutions, no expected outputs
- **1**: A few reference solutions exist but are sparse
- **2**: Reference solutions exist for some suites; expected findings are vague
- **3**: Reference solutions for most suites; `expectedFindings` or clear success criteria in YAML
- **4**: Detailed reference solutions with rationale; assertions map clearly to expected behavior
- **5**: Every suite has a reference solution; solutions include scoring rationale and edge case notes

---

### Dimension 4: Balanced Problem Sets
**Article reference**: Step 3 — "Balance positive and negative test cases"

**What to look for**:
- Ratio of positive to negative suites (e.g., `code-review.yaml` vs `code-review-neg.yaml`)
- `validate-plugin.sh` enforcement of balance
- Suite diversity (capability vs regression, easy vs hard)

**Scoring**:
- **0**: Only positive cases, no negative testing
- **1**: A few negative cases exist but no systematic approach
- **2**: Some suites have negative counterparts; no enforcement
- **3**: Most suites have positive and negative variants; validation script checks for balance
- **4**: Systematic pos/neg pairs; documented philosophy on false-positive testing; enforcement in CI
- **5**: Every suite has pos/neg pair; difficulty gradations; false-positive rate targets documented and measured

---

### Dimension 5: Robust Eval Harness + Stable Environment
**Article reference**: Step 4 — "Build a stable, reproducible evaluation environment"

**What to look for**:
- Provider configuration in `eval-infra/promptfoo-base.yaml` (temperature, model, timeout)
- Sandbox or isolation setup for fixtures
- Reproducibility measures (pinned models, deterministic settings)

**Scoring**:
- **0**: No eval harness; manual evaluation only
- **1**: Basic promptfoo setup but no reproducibility controls
- **2**: Promptfoo config with model specified but no temperature pinning or timeout management
- **3**: Stable config with pinned model, temperature 0, reasonable timeouts; shared base config
- **4**: Isolated fixture environments; deterministic settings; CI runs evals consistently
- **5**: Full sandbox isolation; canary tests for harness health; environment parity with production

---

### Dimension 6: Thoughtful Grader Design
**Article reference**: Step 5 — "Layer graders from deterministic to LLM-based"

**What to look for**:
- Grader type coverage: deterministic (JS), transcript-based, LLM rubrics
- Partial credit support (scores between 0 and 1)
- Evidence of grader calibration

**Scoring**:
- **0**: No custom graders; only built-in assertions
- **1**: One type of grader (e.g., only LLM rubrics)
- **2**: Two grader types present but no layering strategy
- **3**: All three grader types (deterministic, transcript, LLM rubric) present; some partial credit
- **4**: Layered grading strategy documented; shared grader library; calibration evidence
- **5**: Comprehensive grader suite with calibration logs; grader unit tests; partial credit throughout

---

### Dimension 7: Read Transcripts Regularly
**Article reference**: Step 6 — "Regularly review agent transcripts to find failure modes"

**What to look for**:
- Transcript viewer tooling in `eval-infra/scripts/`
- Evidence of actual transcript review (review logs, documented insights)
- Transcript-based graders that validate agent process

**Scoring**:
- **0**: No transcript tooling or review process
- **1**: Transcripts are generated but no viewer or review process
- **2**: Basic transcript viewer exists; no evidence of regular use
- **3**: Transcript viewer script exists; transcript-based graders validate agent process
- **4**: Regular review cadence documented; insights feed back into eval improvements
- **5**: Systematic transcript review with documented learnings; automated anomaly detection

---

### Dimension 8: Monitor Capability Eval Saturation
**Article reference**: Step 7 — "Track when capability evals saturate and graduate them"

**What to look for**:
- `eval-history.jsonl` files with historical data
- `BASELINE.md` with populated metrics
- `record-baseline.sh` script; graduation process documented

**Scoring**:
- **0**: No history tracking or baseline recording
- **1**: Baseline template exists but not populated
- **2**: Baseline script exists; BASELINE.md has structure but no data
- **3**: Baseline recording works; some historical data exists; pass@k metrics defined
- **4**: Regular baseline updates; saturation tracking; eval-history populated across runs
- **5**: Automated saturation detection; graduation process; historical trend analysis

---

### Dimension 9: Maintain Evals Long-Term
**Article reference**: Step 8 — "Treat evals as production code with ownership and maintenance"

**What to look for**:
- `CODEOWNERS` with eval ownership entries
- Maintenance docs, contribution templates
- Plugin validation and structure enforcement

**Scoring**:
- **0**: No ownership model; no maintenance process
- **1**: CODEOWNERS exists but doesn't cover evals
- **2**: Some ownership defined; no contribution process
- **3**: CODEOWNERS covers eval directories; validation script enforces plugin structure
- **4**: Documented contribution process; maintenance cadence; structure validation in CI
- **5**: Full ownership matrix; health dashboards; automated staleness detection; contribution templates

---

### Dimension 10: Non-Determinism Handling
**Article reference**: Cross-cutting — "Handle non-determinism through repeated trials and statistical methods"

**What to look for**:
- `pass@k` implementation in `compute-pass-at-k.py`
- `--trials` support in run scripts
- Temperature strategy; statistical confidence measures

**Scoring**:
- **0**: No awareness of non-determinism; single-run only
- **1**: Acknowledged in docs but not implemented
- **2**: Temperature set to 0 but no multi-trial support
- **3**: `pass@k` computation implemented; run scripts support `--trials`; philosophy doc addresses non-determinism
- **4**: `pass@k` and `pass^k` metrics; targets defined per suite; CI runs multiple trials
- **5**: Statistical confidence intervals; automated retry with analysis; per-case flakiness tracking

---

### Dimension 11: Agent-Specific Approaches
**Article reference**: Cross-cutting — "Evaluate agent-specific qualities: tool use, efficiency, process"

**What to look for**:
- Agent-mode provider configuration (vs raw API)
- Tool-use validation in transcript graders
- Efficiency metrics (token usage, step count)

**Scoring**:
- **0**: Evals treat agent as a simple text-in/text-out function
- **1**: Agent provider configured but no process validation
- **2**: Some tool-use checking but not systematic
- **3**: Transcript graders validate tool usage patterns; agent-mode provider configured
- **4**: Tool-use sequence validation; evidence-gathering process checked; efficiency tracked
- **5**: Full agent behavior profiling; tool-use efficiency metrics; multi-step process validation

---

### Dimension 12: Holistic Evaluation
**Article reference**: Cross-cutting — "Combine automated evals with production monitoring and human review"

**What to look for**:
- CI integration running evals automatically
- Production monitoring or user feedback mechanisms
- Human review process documented

**Scoring**:
- **0**: No integration beyond manual runs
- **1**: Evals exist but not in CI
- **2**: CI runs evals but no monitoring or human review
- **3**: CI integration with threshold gates; eval philosophy documented; some human review
- **4**: CI with regression gating; documented review process; feedback collection mechanism
- **5**: Full loop: CI → production monitoring → user feedback → new eval cases; human-in-the-loop review

---

## Output Format

Produce the report in exactly this structure:

```markdown
## Eval Infrastructure Rubric Report

### Summary
- **Repository**: [repo name]
- **Assessment Date**: [date]
- **Overall Score**: [X]/60 ([Y]%)
- **Minimum Target**: 3/5 per dimension
- **Dimensions Below Target**: [count]

### Scorecard

| # | Dimension | Score | Status | Key Evidence |
|---|-----------|:-----:|--------|-------------|
| 1 | Start Early with Real Failures | X/5 | CRITICAL / REFINEMENT / COMPLETE | [brief evidence] |
| 2 | Source from Real User Behavior | X/5 | ... | ... |
| 3 | Unambiguous Tasks + Reference Solutions | X/5 | ... | ... |
| 4 | Balanced Problem Sets | X/5 | ... | ... |
| 5 | Robust Eval Harness + Stable Environment | X/5 | ... | ... |
| 6 | Thoughtful Grader Design | X/5 | ... | ... |
| 7 | Read Transcripts Regularly | X/5 | ... | ... |
| 8 | Monitor Capability Eval Saturation | X/5 | ... | ... |
| 9 | Maintain Evals Long-Term | X/5 | ... | ... |
| 10 | Non-Determinism Handling | X/5 | ... | ... |
| 11 | Agent-Specific Approaches | X/5 | ... | ... |
| 12 | Holistic Evaluation | X/5 | ... | ... |
| | **Total** | **X/60** | | |

### Critical Recommendations (Dimensions Below 3)

For each dimension scoring below 3, provide:

#### [Dimension Name] — Score: X/5 → Target: 3/5

**Current state**: [What exists now, with file references]
**Gap**: [What's missing to reach 3]
**Actions to reach 3**:
1. [Specific, actionable step with file paths]
2. [Next step]
3. [Next step]

### Refinements (Dimensions at 3+)

For each dimension scoring 3 or above, provide:

#### [Dimension Name] — Score: X/5

**Strengths**: [What's working well, with file references]
**To improve further**:
- [Specific suggestion to reach next level]

### Delta from Previous Run

If a prior rubric output exists in this conversation, show:

| Dimension | Previous | Current | Change |
|-----------|:--------:|:-------:|:------:|
| ... | X/5 | Y/5 | +/-Z |
| **Total** | **X/60** | **Y/60** | **+/-Z** |

(If no prior run exists, state: "No previous run in this session for comparison.")
```

---

## Scoring Thresholds

Apply these status labels based on the score:

| Score | Status | Action |
|-------|--------|--------|
| 0–2 | **CRITICAL** | Include specific recommendation to reach 3 |
| 3–4 | **REFINEMENT** | Include suggestion to improve further |
| 5 | **COMPLETE** | No action needed |

---

## Operating Principles

- **Evidence over opinion**: Every score must cite specific files, counts, or patterns. No hand-waving.
- **Read before scoring**: Actually read the files listed in Evidence Gathering. Do not infer from file names alone.
- **Be calibrated**: A 3 means "adequate foundation, meets minimum bar." Reserve 5 for genuinely excellent implementations.
- **Actionable recommendations**: Each critical recommendation should be a concrete task someone could execute, not a vague aspiration.
- **Delta tracking**: If a prior rubric run exists in this conversation, always show the delta table to track progress.
