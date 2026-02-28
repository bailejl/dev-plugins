# Report Quality Rubric

Evaluate the quality of a generated report (audit, review, analysis). Score each criterion from 1 (poor) to 5 (excellent).

This rubric is designed for commands that produce structured reports, such as code reviews, security audits, architecture assessments, and readiness reports.

---

## 1. Structure (weight: 25%)

Does the report have clear organization? Are there sections, headings, and tables where appropriate?

| Score | Description |
|-------|-------------|
| 1 | No structure. Wall of text with no headings, sections, or logical grouping. |
| 2 | Minimal structure. Some paragraphs but no clear sections. Hard to navigate. |
| 3 | Basic structure. Has sections and headings but inconsistent formatting or missing expected sections. |
| 4 | Well-structured. Clear sections, headings, consistent formatting. Easy to navigate. |
| 5 | Excellent structure. Professional formatting with sections, sub-sections, tables, summary, and table of contents where appropriate. |

---

## 2. Evidence (weight: 30%)

Does the report cite specific evidence? Are file paths, line numbers, code snippets, and concrete examples provided?

| Score | Description |
|-------|-------------|
| 1 | No evidence. Vague claims with no references to actual code, files, or data. |
| 2 | Minimal evidence. A few file names mentioned but no line numbers, no code snippets, no specifics. |
| 3 | Moderate evidence. References to files and some specifics, but many claims lack supporting evidence. |
| 4 | Good evidence. Most findings cite specific files, line numbers, or code snippets. Claims are grounded. |
| 5 | Excellent evidence. Every finding backed by specific file:line references, relevant code snippets, and concrete data points. |

---

## 3. Actionability (weight: 25%)

Does the report provide concrete, actionable recommendations? Can the reader take specific next steps?

| Score | Description |
|-------|-------------|
| 1 | No actionable recommendations. Only describes problems without suggesting fixes. |
| 2 | Vague recommendations. "Improve error handling" or "add tests" without specifics. |
| 3 | Some actionable items. A mix of vague and specific recommendations. |
| 4 | Mostly actionable. Concrete suggestions for what to change and where. Prioritized. |
| 5 | Fully actionable. Every finding has a specific remediation step, prioritized by impact and effort. Includes code examples where helpful. |

---

## 4. Completeness (weight: 20%)

Does the report cover all required sections and areas? Are there gaps in coverage?

| Score | Description |
|-------|-------------|
| 1 | Severely incomplete. Covers less than half the required scope or sections. |
| 2 | Notably incomplete. Missing multiple required sections or areas of analysis. |
| 3 | Mostly complete. One or two minor sections missing or under-developed. |
| 4 | Complete. All required sections present with adequate depth. |
| 5 | Thoroughly complete. All sections present and comprehensive. Covers edge cases and nuances beyond minimum requirements. |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute the weighted total: `(structure * 0.25) + (evidence * 0.30) + (actionability * 0.25) + (completeness * 0.20)`
3. The final score is on a 1-5 scale. A score >= 3.5 is considered passing.

## Output Format

```
structure: <score>/5 — <brief justification>
evidence: <score>/5 — <brief justification>
actionability: <score>/5 — <brief justification>
completeness: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```
