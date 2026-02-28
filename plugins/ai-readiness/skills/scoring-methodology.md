# Scoring Methodology — Unified Framework

This skill defines the unified scoring methodology used across all ai-readiness audit commands. Reference this when computing scores, interpreting results, or explaining thresholds.

---

## Weighted Category Scoring

Every audit command uses **weighted category scoring**:

1. Each command defines categories with assigned percentage weights (must sum to 100%).
2. Each category receives a **raw score** from 0–100.
3. The **weighted score** = raw score × (weight / 100).
4. The **final score** = sum of all weighted scores.

### Raw Score Assignment

| Raw Score Range | Condition |
|-----------------|-----------|
| 100 | No violations found |
| 80–99 | Minor violations only |
| 60–79 | One or more Major violations |
| 40–59 | Critical violations present |
| 0–39 | Multiple Critical violations or systemic failure |

---

## Severity Levels

### Finding Severity

| Level | Symbol | Description | Score Impact |
|-------|--------|-------------|-------------|
| **Critical** | 🔴 | Fundamentally broken, dangerous, or directly exploitable. Requires immediate action. | Caps category raw score at 59 max |
| **Major** | 🟠 | Significant quality/security issue affecting correctness or maintainability. | Caps category raw score at 79 max |
| **Minor** | 🟡 | Style, preference, or defense-in-depth issue. Low immediate risk. | Reduces raw score by 1–5 per finding |

### Section Ratings (full-audit command)

| Rating | Symbol | Meaning |
|--------|--------|---------|
| Critical | 🔴 | Systemic failure requiring immediate remediation |
| High | 🟠 | Significant issues degrading AI performance |
| Medium | 🟡 | Suboptimal patterns with measurable impact |
| Low | 🔵 | Minor issues, address opportunistically |
| Pass | ✅ | Section meets or exceeds expectations |

### Git Health Severity (DORA-weighted)

| Level | Weight Range | Description |
|-------|-------------|-------------|
| 🔴 CRITICAL | 20–25 | Blocks elite DORA performance; immediate action required |
| 🟠 HIGH | 10–15 | Significant impediment to delivery; address within sprint |
| 🟡 MEDIUM | 5–10 | Suboptimal practice; schedule improvement work |
| 🟢 LOW | 1–5 | Minor issue; address opportunistically |

---

## Pass/Fail Thresholds

| Command | Pass Threshold | Rationale |
|---------|---------------|-----------|
| code-review | ≥ 75 | Standard quality bar |
| architecture | ≥ 75 | Standard quality bar |
| security | ≥ 80 | Security requires higher bar due to outsized risk |
| testing | ≥ 75 | Standard quality bar |
| api-review | ≥ 75 | Standard quality bar |

---

## Auto-Fail Conditions

Certain findings trigger an automatic **FAIL** regardless of the numeric score:

- **Security command**: Any single **Critical** finding = automatic FAIL
- **Git health**: Secrets/credentials detected in repository = automatic CRITICAL flag
- **Full audit**: Any 🔴 Critical section rating warrants immediate remediation notice

---

## Score Computation Procedure

1. **Gather evidence** for each category using tools (grep, glob, git commands, file reads).
2. **List findings** with specific file/line references.
3. **Classify** each finding as Critical, Major, or Minor.
4. **Compute raw score** per category based on worst severity found.
5. **Apply weights** to get weighted scores.
6. **Sum** weighted scores for the final score.
7. **Check auto-fail** conditions.
8. **Compare** final score against the command's pass threshold.

### Example Calculation

```
Category: Error Handling (Weight: 20%)
  Finding 1: Empty catch block in auth.ts:45 → Major
  Finding 2: Swallowed promise rejection in api.ts:102 → Major
  Finding 3: Missing null check in utils.ts:23 → Minor
  → Worst severity: Major → Raw score capped at 79 max
  → Adjusted for volume: Raw score = 65
  → Weighted score = 65 × 0.20 = 13.0

Category: Naming (Weight: 10%)
  Finding 1: Inconsistent casing in helpers/ → Minor
  → Raw score = 90
  → Weighted score = 90 × 0.10 = 9.0

Final score = sum of all weighted scores
```

---

## Cross-Command Consistency Rules

- Always show the score breakdown table in the report output.
- Always list findings with specific file:line references.
- Always classify findings by severity before scoring.
- When multiple severities exist in one category, the **worst** severity determines the raw score ceiling; the **volume** of findings determines the actual score within that ceiling.
- Round weighted scores to one decimal place.
- Round final scores to the nearest integer.
