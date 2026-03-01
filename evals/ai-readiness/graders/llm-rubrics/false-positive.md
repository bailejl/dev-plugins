# False Positive Rubric

Evaluate the false positive rate of an audit or review. Score from 1 (poor) to 5 (excellent).

A **false positive** is a finding that identifies a "problem" that doesn't actually exist, is not actually problematic, or mischaracterizes acceptable code as having issues.

---

## Scoring Scale

| Score | Description |
|-------|-------------|
| 1 | Many false positives (>50% of findings). Report is mostly noise. Phantom issues fabricated, acceptable code flagged as problematic, or findings contradict the actual code. |
| 2 | Significant false positives (30-50%). Several findings are phantom or mischaracterized. Signal-to-noise ratio is poor. |
| 3 | Moderate false positives (15-30%). Some findings are debatable or nitpicky but most are legitimate. A few phantom findings present. |
| 4 | Few false positives (<15%). Findings are almost all real issues. At most one or two nitpicky or debatable items. |
| 5 | No false positives. Every finding is a genuine, verifiable issue. Report is precise with zero noise. |

---

## What Counts as a False Positive

- **Phantom findings**: Issues that don't exist in the code (hallucinated problems)
- **Mischaracterized code**: Acceptable patterns flagged as anti-patterns
- **Severity inflation**: Minor style preferences flagged as critical/major issues
- **Context-blind findings**: Issues flagged without considering the project's context or conventions
- **Non-issues**: Flagging standard, widely-accepted patterns as problems

## What Does NOT Count as a False Positive

- Minor suggestions or recommendations (as long as they're not flagged as critical)
- True findings with low severity ratings
- Debatable style preferences explicitly marked as suggestions

---

## Scoring Instructions

1. Review each finding in the report.
2. For each finding, determine if it's real (exists in the code and is actually problematic).
3. Count the number of false positives.
4. Score based on the percentage scale above.
5. A score >= 4 is passing.

## Output Format

```
false_positives_found: <count>
total_findings: <count>
false_positive_rate: <percentage>
examples: <list 1-3 specific false positives if any>
score: <1-5>
pass: <true|false>
reasoning: <1-2 sentence assessment>
```

---

## Calibration Examples

### Score 1/5
Reports "SQL injection vulnerability" in code that uses parameterized queries; flags "hardcoded secret" for a public API base URL constant. Multiple phantom findings that don't exist in the code.

### Score 3/5
Mostly accurate findings, but flags a well-documented intentional `any` type as a type safety issue. One or two debatable items but majority of findings are legitimate.

### Score 5/5
Every finding verified against actual code; no phantom issues; correctly identifies that clean-repo has no critical issues. Zero noise in the report.
