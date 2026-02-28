# Component API Design Rubric

Evaluate the design of a React component's public API (props interface). Score each criterion from 1 (poor) to 5 (excellent).

---

## 1. Clarity (weight: 30%)

Are prop names clear and self-documenting? Can a developer understand the API without reading the implementation?

| Score | Description |
|-------|-------------|
| 1 | Cryptic prop names. Single letters, abbreviations, or misleading names. No documentation. |
| 2 | Unclear props. Some names are ambiguous (e.g., `data`, `info`, `config` without specificity). |
| 3 | Adequate clarity. Most props are understandable. One or two could be clearer. |
| 4 | Clear API. Props are descriptive, follow conventions (e.g., `onX` for callbacks, `isX` for booleans). |
| 5 | Self-documenting. Every prop name communicates its purpose. JSDoc comments on complex props. |

---

## 2. Minimality (weight: 25%)

Is the API surface minimal? Does it expose only what consumers need?

| Score | Description |
|-------|-------------|
| 1 | Bloated API. Many props that should be internal, implementation details exposed as props. |
| 2 | Somewhat bloated. Several props that most consumers won't use, or redundant props. |
| 3 | Reasonable API. Mostly necessary props, one or two that could be removed or defaulted. |
| 4 | Clean API. Each prop serves a clear consumer need. Sensible defaults reduce required props. |
| 5 | Minimal and complete. Nothing to add, nothing to remove. Every prop is essential, every default is sensible. |

---

## 3. Composability (weight: 25%)

Can the component be composed with other components? Does it support standard React patterns?

| Score | Description |
|-------|-------------|
| 1 | Not composable. Renders everything internally, no children support, no render customization. |
| 2 | Limited composability. Accepts some content but inflexible (e.g., only string labels, no custom rendering). |
| 3 | Moderate composability. Accepts children or render props but some areas are locked down. |
| 4 | Good composability. Supports children, className, ref forwarding, and standard HTML attributes via spread. |
| 5 | Highly composable. Supports children, render customization, className merging, ref forwarding, and as-prop or polymorphism where appropriate. |

---

## 4. Type Safety (weight: 20%)

Are prop types specific enough to catch misuse at compile time?

| Score | Description |
|-------|-------------|
| 1 | No types or all `any`. Accepts anything without validation. |
| 2 | Loose types. `string` where a union would be better. `object` instead of a specific shape. |
| 3 | Adequate types. Specific enough for basic use but some props could be narrower. |
| 4 | Good types. Union types for variants, specific callback signatures, optional markers correct. |
| 5 | Precise types. Discriminated unions, generic types where beneficial, conditional prop types (e.g., `size` only when `variant` is specific). |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute the weighted total: `(clarity * 0.30) + (minimality * 0.25) + (composability * 0.25) + (typeSafety * 0.20)`
3. The final score is on a 1-5 scale. A score >= 3.5 is considered passing.

## Output Format

```
clarity: <score>/5 — <brief justification>
minimality: <score>/5 — <brief justification>
composability: <score>/5 — <brief justification>
type_safety: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```
