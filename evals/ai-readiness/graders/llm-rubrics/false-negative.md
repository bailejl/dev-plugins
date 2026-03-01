# False Negative Rubric

Evaluate the false negative rate of an audit or review against known planted issues. Score from 1 (poor) to 5 (excellent).

A **false negative** is a known, planted issue that the audit FAILED to identify. Higher score = fewer misses.

---

## Scoring Scale

| Score | Description |
|-------|-------------|
| 1 | Missed >60% of known issues. The audit is largely ineffective. Major problems overlooked entirely. |
| 2 | Missed 40-60% of known issues. Significant gaps in detection. Several critical issues not found. |
| 3 | Missed 20-40% of known issues. Some important issues detected but notable gaps remain. |
| 4 | Missed 10-20% of known issues. Most issues found with only minor gaps. Perhaps one critical issue missed. |
| 5 | Missed <10% of known issues. Comprehensive detection — virtually all planted issues identified. |

---

## Evaluation Process

The test case will provide a list of known, planted issues in the fixture repository. For each:

1. **Check if the audit identified it** — the finding must substantively address the issue, not just mention a tangentially related topic.
2. **Partial credit** — if the audit identifies the general area but misses the specific instance, that counts as a partial detection.
3. **Severity matching** — for critical issues that are detected but rated as minor/low, count as a partial miss (the issue was found but its severity was underestimated).

---

## Scoring Instructions

1. List each known issue from the test case.
2. For each, check: fully detected, partially detected, or missed.
3. Calculate: `(fully_detected + 0.5 * partially_detected) / total_known_issues`
4. Map the detection rate to the 1-5 scale.
5. A score >= 4 is passing.

## Output Format

```
known_issues: <count>
fully_detected: <count>
partially_detected: <count>
missed: <count>
detection_rate: <percentage>
missed_issues: <list the specific issues that were missed>
score: <1-5>
pass: <true|false>
reasoning: <1-2 sentence assessment>
```

---

## Calibration Examples

### Score 1/5
Reports only 1 of 5 planted security issues; misses SQL injection and hardcoded secrets entirely. The audit is largely ineffective at detecting known problems.

### Score 3/5
Catches 3 of 5 planted issues; misses subtle ones like weak hashing algorithm choice. Moderate detection rate with notable gaps on less obvious issues.

### Score 5/5
Catches all 5 planted issues with correct severity ratings and specific file:line references. Comprehensive detection with no significant misses.
