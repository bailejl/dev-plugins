# React Code Quality Rubric

Evaluate the generated React code for quality, correctness, and adherence to React best practices. Score each criterion from 1 (poor) to 5 (excellent).

---

## 1. Component Structure (weight: 25%)

Is the component well-organized with clear separation of concerns?

| Score | Description |
|-------|-------------|
| 1 | No structure. Logic, rendering, and side effects mixed together. No separation at all. |
| 2 | Poor structure. Some separation but concerns are still tangled. Props and state mixed poorly. |
| 3 | Adequate structure. Reasonable separation but some logic in JSX or effects doing too much. |
| 4 | Good structure. Clean separation of state, effects, handlers, and rendering. Easy to follow. |
| 5 | Excellent structure. Each section has a clear purpose. Hooks at top, handlers next, JSX last. |

---

## 2. React Patterns (weight: 25%)

Does the code use React hooks, patterns, and conventions correctly?

| Score | Description |
|-------|-------------|
| 1 | Violates rules of hooks. Incorrect dependency arrays. Anti-patterns throughout (state in refs, effects as event handlers). |
| 2 | Significant pattern issues. Missing dependencies, derived state in useState+useEffect, unnecessary re-renders. |
| 3 | Mostly correct patterns. Minor issues like overly broad dependency arrays or unnecessary memoization. |
| 4 | Good patterns. Hooks used correctly, appropriate memoization, proper state management. |
| 5 | Expert patterns. Elegant hook composition, optimal rendering, correct mental model throughout. |

---

## 3. TypeScript / Props API (weight: 20%)

Is the component's interface well-designed? Are types correct and specific?

| Score | Description |
|-------|-------------|
| 1 | No types or all `any`. Props interface is confusing or undocumented. |
| 2 | Partial typing. Some `any` usage, unclear prop names, missing optional markers. |
| 3 | Adequate typing. Props are typed but could be more specific (e.g., `string` where a union would be better). |
| 4 | Good typing. Specific types, clear prop names, JSDoc on complex props, proper optional markers. |
| 5 | Excellent typing. Discriminated unions where appropriate, generics if needed, fully documented interface. |

---

## 4. Accessibility (weight: 15%)

Does the component follow accessibility best practices?

| Score | Description |
|-------|-------------|
| 1 | No accessibility consideration. Divs for everything, no ARIA, no keyboard handling. |
| 2 | Minimal accessibility. Some semantic HTML but missing labels, roles, or keyboard support. |
| 3 | Basic accessibility. Semantic HTML and some ARIA, but gaps in keyboard navigation or focus management. |
| 4 | Good accessibility. Proper semantic HTML, ARIA where needed, keyboard support, focus management. |
| 5 | Excellent accessibility. Complete ARIA support, focus trapping for modals, screen reader tested patterns. |

---

## 5. Simplicity (weight: 15%)

Is the code appropriately simple for the task? Does it avoid over-engineering?

| Score | Description |
|-------|-------------|
| 1 | Massively over-engineered. Factories, unnecessary abstractions, complex patterns for a simple task. |
| 2 | Notably over-engineered. Extra layers of indirection, unused configurability, premature optimization. |
| 3 | Slightly over-engineered. One or two unnecessary patterns but generally reasonable. |
| 4 | Appropriately scoped. Simple where simple suffices, complex only where warranted. |
| 5 | Perfectly scoped. Minimum viable complexity. Every line earns its place. |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute the weighted total: `(structure * 0.25) + (patterns * 0.25) + (types * 0.20) + (a11y * 0.15) + (simplicity * 0.15)`
3. The final score is on a 1-5 scale. A score >= 3.5 is considered passing.

## Output Format

```
component_structure: <score>/5 — <brief justification>
react_patterns: <score>/5 — <brief justification>
typescript_props_api: <score>/5 — <brief justification>
accessibility: <score>/5 — <brief justification>
simplicity: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```

---

## Calibration Examples

### Score 1/5
Class component with no types, inline styles, no error boundaries, massive render method. Violates rules of hooks, mixes concerns throughout, no separation of logic and rendering.

### Score 3/5
Functional component with basic TypeScript, some prop types, but missing memoization for expensive computations, no error boundary. Adequate structure but room for improvement in patterns and types.

### Score 5/5
Well-typed functional component with proper hooks, React.memo where needed, clear prop interface extending HTML attributes, accessible by default, clean separation of concerns. Every line earns its place.
