# Finding Quality Rubric

Evaluate the quality of individual findings in an audit or review report. Score from 1 (poor) to 5 (excellent).

---

## 1. Specificity (weight: 30%)

How precise and targeted are the findings?

| Score | Description |
|-------|-------------|
| 1 | Vague, generic statements: "code quality could be improved", "consider refactoring" |
| 2 | Somewhat specific but lacks detail: "naming is inconsistent" without examples |
| 3 | Moderately specific: names the general area but missing file paths or exact instances |
| 4 | Specific: references exact files, describes the specific pattern or instance |
| 5 | Highly specific: cites file:line, quotes the problematic code, explains exactly what's wrong |

---

## 2. Evidence Quality (weight: 30%)

Does each finding cite concrete evidence from the codebase?

| Score | Description |
|-------|-------------|
| 1 | No evidence cited. Findings appear fabricated or assumed. |
| 2 | Minimal evidence: mentions a file name but no code or line references |
| 3 | Moderate evidence: includes some file paths and general descriptions |
| 4 | Good evidence: most findings cite specific files, some include code snippets |
| 5 | Excellent evidence: every finding backed by file:line references, relevant code snippets, or command output |

---

## 3. Severity Justification (weight: 20%)

Are severity ratings justified and proportionate?

| Score | Description |
|-------|-------------|
| 1 | No severity ratings, or all findings rated the same regardless of impact |
| 2 | Severity ratings present but seem arbitrary or consistently over/under-rated |
| 3 | Most severity ratings are reasonable but some lack justification |
| 4 | Severity ratings are appropriate with brief justifications |
| 5 | Every severity rating is well-justified, considering impact, exploitability, and scope |

---

## 4. Actionability (weight: 20%)

Does each finding include an actionable recommendation?

| Score | Description |
|-------|-------------|
| 1 | No recommendations attached to findings |
| 2 | Generic recommendations: "fix this", "improve that" |
| 3 | Some specific recommendations but many are still vague |
| 4 | Most findings have concrete fix suggestions |
| 5 | Every finding has a specific, implementable recommendation with examples or references |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute: `(specificity * 0.30) + (evidence * 0.30) + (severity * 0.20) + (actionability * 0.20)`
3. A score >= 3.5 is passing.

## Output Format

```
specificity: <score>/5 — <brief justification>
evidence_quality: <score>/5 — <brief justification>
severity_justification: <score>/5 — <brief justification>
actionability: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```
