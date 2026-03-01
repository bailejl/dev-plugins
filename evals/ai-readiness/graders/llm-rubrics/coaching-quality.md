# Coaching Quality Rubric

Evaluate the quality of coaching and recommendations in an audit or review report. Score from 1 (poor) to 5 (excellent).

Good coaching teaches the reader not just WHAT to fix but WHY it matters and HOW to fix it.

---

## 1. Actionability (weight: 25%)

Can the reader take specific, concrete next steps from the recommendations?

| Score | Description |
|-------|-------------|
| 1 | No actionable steps. Only identifies problems without solutions. |
| 2 | Vague actions: "improve testing", "refactor code", "add documentation" |
| 3 | Some concrete actions but many are still generic |
| 4 | Most recommendations include specific steps: what to change, where, and how |
| 5 | Every recommendation is immediately actionable with code examples, specific file references, or step-by-step instructions |

---

## 2. Specificity (weight: 25%)

Are recommendations tailored to this specific codebase, not generic advice?

| Score | Description |
|-------|-------------|
| 1 | Entirely generic advice that could apply to any project |
| 2 | Mostly generic with occasional specific references |
| 3 | Mix of generic and specific advice |
| 4 | Mostly specific to this codebase with references to actual files and patterns |
| 5 | Every recommendation is specific: references exact code, proposes concrete changes, tailored to this project's context |

---

## 3. Prioritization (weight: 20%)

Are recommendations ordered or categorized by importance and impact?

| Score | Description |
|-------|-------------|
| 1 | No prioritization. Items listed randomly. |
| 2 | Minimal grouping but no clear priority ordering |
| 3 | Some grouping by category but impact/effort not considered |
| 4 | Clear prioritization with severity or impact levels |
| 5 | Excellent prioritization: grouped by priority, considers impact vs effort, quick wins identified |

---

## 4. Feasibility (weight: 15%)

Are the recommendations realistic and achievable?

| Score | Description |
|-------|-------------|
| 1 | Unrealistic suggestions (complete rewrites, impossible scope) |
| 2 | Some recommendations are impractical or out of scope |
| 3 | Most recommendations are feasible but scope isn't well-defined |
| 4 | Recommendations are practical and appropriately scoped |
| 5 | Recommendations are incremental, achievable, and include effort estimates |

---

## 5. Teaching the "Why" (weight: 15%)

Do recommendations explain the reasoning behind changes?

| Score | Description |
|-------|-------------|
| 1 | No explanation of why changes are needed |
| 2 | Minimal context: states the rule without explaining the benefit |
| 3 | Some explanation of trade-offs and benefits |
| 4 | Good explanations: most recommendations explain why the change improves the codebase |
| 5 | Excellent teaching: explains the principle, the risk of the current approach, and the benefit of the recommended change |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute: `(actionability * 0.25) + (specificity * 0.25) + (prioritization * 0.20) + (feasibility * 0.15) + (teaching * 0.15)`
3. A score >= 3.5 is passing.

## Output Format

```
actionability: <score>/5 — <brief justification>
specificity: <score>/5 — <brief justification>
prioritization: <score>/5 — <brief justification>
feasibility: <score>/5 — <brief justification>
teaching_the_why: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```

---

## Calibration Examples

### Score 1/5
> "You should fix the security issues and write more tests"

Generic advice, no specifics, no prioritization, not tailored to the codebase.

### Score 3/5
> "Replace MD5 with bcrypt for password hashing in auth.js. Add input validation to API endpoints."

Correct and actionable, but missing priority levels, feasibility context, and effort estimates.

### Score 5/5
> "IMMEDIATE (P0): Replace MD5 with bcrypt in src/auth.js:23 — `npm install bcrypt`, then `const hash = await bcrypt.hash(password, 12)`. This blocks production readiness. NEXT SPRINT (P1): Add parameterized queries in src/db.js:15-20 to prevent SQL injection."

Prioritized with timeline, specific file:line references, code snippets, and clear impact rationale.
