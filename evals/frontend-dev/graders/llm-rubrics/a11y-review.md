# Accessibility Review Rubric

Evaluate the accessibility quality of a React component or audit report. Score each criterion from 1 (poor) to 5 (excellent).

---

## 1. Semantic HTML (weight: 25%)

Does the code use appropriate semantic HTML elements instead of generic divs/spans?

| Score | Description |
|-------|-------------|
| 1 | All generic elements. Div soup with no semantic meaning. Buttons are divs, nav is a div, etc. |
| 2 | Mostly generic. Some semantic elements but key interactive elements are wrong (div with onClick instead of button). |
| 3 | Partially semantic. Uses some correct elements (button, a) but misses landmarks (header, main, nav, aside). |
| 4 | Good semantics. Correct interactive elements, some landmarks, proper heading hierarchy. |
| 5 | Excellent semantics. Full use of semantic HTML, correct landmarks, heading hierarchy, list elements for lists, etc. |

---

## 2. ARIA Implementation (weight: 25%)

Are ARIA roles, states, and properties used correctly and only when native HTML is insufficient?

| Score | Description |
|-------|-------------|
| 1 | ARIA misused or completely absent. Roles on wrong elements, required ARIA attributes missing, aria-hidden on focusable elements. |
| 2 | Poor ARIA. Some attributes present but incorrect (e.g., wrong role, missing required state updates, stale aria-expanded). |
| 3 | Basic ARIA. Core attributes present (aria-label, role) but missing dynamic state updates or incomplete widget patterns. |
| 4 | Good ARIA. Correct roles, states updated dynamically, live regions for announcements, no redundant ARIA. |
| 5 | Expert ARIA. Complete widget patterns (tabs, combobox, dialog), proper live regions, aria-describedby for complex interactions. First rule of ARIA respected (native HTML preferred). |

---

## 3. Keyboard Accessibility (weight: 25%)

Can all functionality be accessed and operated with keyboard alone?

| Score | Description |
|-------|-------------|
| 1 | Not keyboard accessible. Click-only interactions, no tabindex on custom elements, keyboard traps. |
| 2 | Partial keyboard access. Some elements reachable but missing key handlers (Enter/Space on custom buttons, Escape on popups). |
| 3 | Basic keyboard access. Main actions work but missing arrow key navigation in composite widgets, no focus management for modals. |
| 4 | Good keyboard access. All interactions work, focus management present, Escape closes popups, visible focus indicators. |
| 5 | Full keyboard access. Complete arrow key patterns for widgets, roving tabindex, focus trapping in modals, skip links, no traps. |

---

## 4. Screen Reader Experience (weight: 15%)

Will screen readers provide a good experience? Are names, descriptions, and announcements correct?

| Score | Description |
|-------|-------------|
| 1 | Unusable with screen reader. Missing accessible names, unlabeled inputs, no announcements for dynamic content. |
| 2 | Poor experience. Some labels present but confusing order, missing descriptions, unlabeled icons. |
| 3 | Usable but suboptimal. Key elements labeled, but some context missing, no live region announcements. |
| 4 | Good experience. Proper labels, descriptions, live regions for dynamic updates, status messages announced. |
| 5 | Excellent experience. Every element has clear purpose announced, state changes communicated, loading states announced, error messages associated with fields. |

---

## 5. Visual Accessibility (weight: 10%)

Are contrast, sizing, and visual cues accessible?

| Score | Description |
|-------|-------------|
| 1 | No consideration. Tiny text, no contrast awareness, information conveyed by color alone. |
| 2 | Minimal consideration. Some contrast awareness but hardcoded light colors, no focus-visible styles. |
| 3 | Basic consideration. Uses theme colors (likely passing contrast), has some focus styles. |
| 4 | Good visual accessibility. Focus-visible styles, contrast-aware colors, touch targets >= 44px. |
| 5 | Excellent. Respects prefers-reduced-motion, prefers-contrast, adequate touch targets, dual-cue indicators (color + icon). |

---

## Scoring Instructions

1. Score each criterion independently from 1-5.
2. Compute the weighted total: `(semanticHTML * 0.25) + (aria * 0.25) + (keyboard * 0.25) + (screenReader * 0.15) + (visual * 0.10)`
3. The final score is on a 1-5 scale. A score >= 3.5 is considered passing.

## Output Format

```
semantic_html: <score>/5 — <brief justification>
aria_implementation: <score>/5 — <brief justification>
keyboard_accessibility: <score>/5 — <brief justification>
screen_reader_experience: <score>/5 — <brief justification>
visual_accessibility: <score>/5 — <brief justification>
weighted_total: <computed>/5
pass: <true|false>
reasoning: <1-2 sentence overall assessment>
```
