# Code Quality Rubric

Evaluate the generated code for overall quality. Score each criterion from 1 (poor) to 5 (excellent).

---

## 1. Correctness (weight: 30%)

Does the code do what was asked? Does it produce the expected behavior without bugs?

| Score | Description |
|-------|-------------|
| 1 | Code does not run or produces entirely wrong output. Critical logic errors. |
| 2 | Code runs but has significant bugs. Missing key functionality or major edge cases. |
| 3 | Core functionality works. Minor bugs or missed edge cases that don't break primary use. |
| 4 | All specified functionality works correctly. Handles common edge cases. |
| 5 | Fully correct. Handles edge cases, boundary conditions, and error states gracefully. |

---

## 2. Readability (weight: 20%)

Is the code easy to understand? Are names descriptive? Is the structure logical?

| Score | Description |
|-------|-------------|
| 1 | Incomprehensible. Single-letter variables, no structure, dense and tangled logic. |
| 2 | Difficult to follow. Inconsistent naming, unclear control flow, poor organization. |
| 3 | Reasonably readable. Some unclear names or unnecessarily complex sections. |
| 4 | Clear and well-organized. Descriptive names, logical flow, easy to follow. |
| 5 | Exemplary clarity. Self-documenting code, excellent naming, clean structure throughout. |

---

## 3. Maintainability (weight: 20%)

Can the code be easily modified or extended? Is it modular? Does it follow separation of concerns?

| Score | Description |
|-------|-------------|
| 1 | Monolithic, tightly coupled. Any change would require rewriting large sections. |
| 2 | Mostly coupled. Some modularity but changing one part risks breaking others. |
| 3 | Reasonable modularity. Some coupling but changes are localized to a few areas. |
| 4 | Well-modularized. Clear boundaries, easy to add features or modify behavior. |
| 5 | Highly modular and extensible. Clean interfaces, single responsibility, easy to evolve. |

---

## 4. Idiomatic Usage (weight: 15%)

Does the code use language/framework features appropriately? Does it follow ecosystem conventions?

| Score | Description |
|-------|-------------|
| 1 | Fights the framework. Uses anti-patterns, ignores language features, reinvents built-ins. |
| 2 | Partially idiomatic. Some correct patterns mixed with non-standard approaches. |
| 3 | Generally idiomatic. Follows most conventions with occasional deviations. |
| 4 | Idiomatic. Uses appropriate language features, follows framework conventions. |
| 5 | Expert-level idiomatic usage. Leverages the ecosystem effectively, follows best practices. |

---

## 5. Error Handling (weight: 15%)

Does the code handle failures gracefully? Are errors caught, reported, or propagated appropriately?

| Score | Description |
|-------|-------------|
| 1 | No error handling. Crashes or produces undefined behavior on invalid input. |
| 2 | Minimal error handling. Some try/catch but errors are swallowed or poorly reported. |
| 3 | Basic error handling for common cases. Some gaps in coverage or generic messages. |
| 4 | Good error handling. Meaningful messages, appropriate catch scopes, user-facing errors are clear. |
| 5 | Comprehensive error handling. Graceful degradation, informative errors, appropriate error boundaries. |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute the weighted total: `(correctness * 0.30) + (readability * 0.20) + (maintainability * 0.20) + (idiomatic * 0.15) + (errorHandling * 0.15)`
3. The final score is on a 1-5 scale. A score >= 3.5 is considered passing.

## Output Format

```
correctness: <score>/5 — <brief justification>
readability: <score>/5 — <brief justification>
maintainability: <score>/5 — <brief justification>
idiomatic_usage: <score>/5 — <brief justification>
error_handling: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```
