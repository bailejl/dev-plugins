# Over-Engineering Detection Rubric

Evaluate whether the generated code is over-engineered relative to the task requirements. Score each criterion from 1 (severely over-engineered) to 5 (appropriately scoped).

Higher scores mean LESS over-engineering (i.e., 5 = perfectly scoped).

---

## 1. Unnecessary Abstractions (weight: 30%)

Does the code introduce abstractions (classes, interfaces, factories, wrappers) that aren't justified by the task?

| Score | Description |
|-------|-------------|
| 1 | Extreme abstraction. Factory-of-factories, deep inheritance trees, or abstract base classes for single implementations. |
| 2 | Significant over-abstraction. Multiple layers of indirection for straightforward operations. Interfaces with single implementors. |
| 3 | Some unnecessary abstraction. One or two layers that could be removed without loss. |
| 4 | Mostly appropriate. Abstractions exist where they add clear value. Minor simplification possible. |
| 5 | Perfectly scoped. Every abstraction earns its place. Direct and simple where simple suffices. |

---

## 2. Premature Optimization (weight: 25%)

Does the code optimize for performance or scale that the task does not require?

| Score | Description |
|-------|-------------|
| 1 | Heavily optimized for imaginary scale. Caching, memoization, lazy loading, or custom data structures where simple approaches work. |
| 2 | Notable premature optimization. Performance-oriented patterns that add complexity without measurable benefit for the task. |
| 3 | Minor optimization overhead. One or two optimizations that are unnecessary but don't significantly hurt readability. |
| 4 | Appropriate performance considerations. Optimizes only where clearly beneficial. |
| 5 | No premature optimization. Simple, direct implementation. Performance addressed only where the task demands it. |

---

## 3. Over-Configuration (weight: 25%)

Does the code make things configurable, generic, or extensible beyond what was asked?

| Score | Description |
|-------|-------------|
| 1 | Everything is configurable. Config files, environment variables, options objects, and plugin systems for a fixed-scope task. |
| 2 | Significant over-configuration. Multiple parameters, options, or feature flags for things the task specified as fixed. |
| 3 | Some unnecessary configurability. A few extra options or parameters that weren't requested. |
| 4 | Mostly task-focused. Configuration exists where the task requires flexibility. |
| 5 | Exactly the right configurability. Hard-codes what should be fixed, parameterizes what the task explicitly needs variable. |

---

## 4. Excessive Indirection (weight: 20%)

Does the code use unnecessary layers, delegation, or routing? Can you trace what happens easily?

| Score | Description |
|-------|-------------|
| 1 | Extreme indirection. Must follow 5+ files/functions to understand a single operation. Event buses, middleware chains, or strategy patterns for simple logic. |
| 2 | High indirection. Multiple hops to reach actual logic. Helper functions that do trivial things. |
| 3 | Moderate indirection. One or two unnecessary layers but the core flow is traceable. |
| 4 | Minimal indirection. Code is generally direct with clear call chains. |
| 5 | Direct and traceable. Each function does real work. No unnecessary delegation or routing. |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute the weighted total: `(abstractions * 0.30) + (optimization * 0.25) + (configuration * 0.25) + (indirection * 0.20)`
3. The final score is on a 1-5 scale. A score >= 3.5 is considered passing (not over-engineered).

## Output Format

```
unnecessary_abstractions: <score>/5 — <brief justification>
premature_optimization: <score>/5 — <brief justification>
over_configuration: <score>/5 — <brief justification>
excessive_indirection: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment of scope appropriateness>
```
