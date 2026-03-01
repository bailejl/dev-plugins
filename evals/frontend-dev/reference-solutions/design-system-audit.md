# Design System Compliance Audit — HardcodedCard

## Summary

The `HardcodedCard` component (`fixtures/design-system/src/HardcodedCard.jsx`) uses hardcoded style values throughout instead of referencing the design tokens defined in `tokens.js`. This undermines consistency, makes theming impossible, and creates maintenance burden when design values change.

## Token Reference

The project defines a comprehensive token system in `fixtures/design-system/src/tokens.js` covering colors, spacing, typography, borders, shadows, transitions, and z-index values.

## Findings

### High

#### 1. Hardcoded Color Values — Throughout `HardcodedCard.jsx`

**Severity**: HIGH

The component uses raw hex values instead of design tokens:

| Line | Hardcoded Value | Should Be |
|------|----------------|-----------|
| 20 | `backgroundColor: '#fff'` | `tokens.colors.background.primary` (`#ffffff`) |
| 21 | `border: '1px solid #e0e0e0'` | `tokens.borders.width.thin` + `tokens.colors.border.default` (`#dadce0`) |
| 48 | `color: '#333'` | `tokens.colors.text.primary` (`#202124`) |
| 59 | `color: '#666'` | `tokens.colors.text.secondary` (`#5f6368`) |
| 73 | `backgroundColor: '#f5f5f5'` | `tokens.colors.background.tertiary` (`#f1f3f4`) |
| 74 | `color: '#666'` | `tokens.colors.text.secondary` |
| 89 | `backgroundColor: '#1a73e8'` | `tokens.colors.primary` |
| 90 | `color: '#fff'` | `tokens.colors.text.inverse` |
| 101 | `backgroundColor = '#1557b0'` | `tokens.colors.primaryHover` |
| 120 | `backgroundColor: '#1a73e8'` | `tokens.colors.primary` |
| 121 | `color: 'white'` | `tokens.colors.text.inverse` |

**Impact**: Changing the brand's primary color requires finding and updating every `#1a73e8` instance. Dark mode / theming is impossible. Subtle inconsistencies creep in (e.g., `#333` vs the token's `#202124`, `#e0e0e0` vs `#dadce0`).

**Note**: Some hardcoded colors are *close but not exact* matches to the tokens. For example, `#333` is used instead of the text primary token `#202124`, and `#e0e0e0` instead of `#dadce0`. These near-misses are worse than obvious differences because they appear intentional but aren't.

---

#### 2. Hardcoded Spacing — Throughout `HardcodedCard.jsx`

**Severity**: HIGH

All spacing uses raw pixel values instead of spacing tokens:

| Line | Hardcoded Value | Should Be |
|------|----------------|-----------|
| 24 | `padding: '24px'` | `tokens.spacing.xl` |
| 39 | `marginBottom: '16px'` | `tokens.spacing.lg` |
| 49 | `margin: '0 0 8px 0'` | `tokens.spacing.sm` |
| 62 | `margin: '0 0 16px 0'` | `tokens.spacing.lg` |
| 68 | `gap: '8px'` | `tokens.spacing.sm` |
| 68 | `marginBottom: '16px'` | `tokens.spacing.lg` |
| 75 | `padding: '4px 12px'` | `tokens.spacing.xs` + `tokens.spacing.md` |
| 93 | `padding: '8px 16px'` | `tokens.spacing.sm` + `tokens.spacing.lg` |
| 113-114 | `top: '12px'`, `right: '12px'` | `tokens.spacing.md` |
| 125 | `padding: '4px 8px'` | `tokens.spacing.xs` + `tokens.spacing.sm` |

**Impact**: Spacing inconsistencies emerge as developers guess values. A spacing scale change (e.g., switching to 8px base grid) requires updating every hardcoded value.

---

#### 3. Hardcoded Font Sizes and Weights — `HardcodedCard.jsx:46-47, 58, 78, 93, 126`

**Severity**: HIGH

Typography values are hardcoded instead of using design tokens:

| Line | Hardcoded Value | Should Be |
|------|----------------|-----------|
| 46 | `fontSize: '20px'` | `tokens.typography.fontSize.xl` (`1.25rem`) |
| 47 | `fontWeight: 600` | `tokens.typography.fontWeight.medium` (500) or `bold` (700) |
| 58 | `fontSize: '14px'` | `tokens.typography.fontSize.sm` (`0.875rem`) |
| 78 | `fontSize: '12px'` | `tokens.typography.fontSize.xs` (`0.75rem`) |
| 93 | `fontSize: '14px'` | `tokens.typography.fontSize.sm` |
| 126 | `fontSize: '12px'` | `tokens.typography.fontSize.xs` |

**Note**: `fontWeight: 600` is used but does not match any token. The closest options are `medium` (500) or `bold` (700). This indicates the component is using a non-standard weight.

**Impact**: Font sizes in `px` don't scale with user preferences. Typography inconsistencies across components when different developers pick different pixel values.

---

### Medium

#### 4. Hardcoded Border Radius — `HardcodedCard.jsx:22, 38, 76, 92, 124`

**Severity**: MEDIUM

```jsx
borderRadius: '8px'   // lines 22, 38 — should be tokens.borders.radius.md
borderRadius: '9999px' // line 76 — should be tokens.borders.radius.full
borderRadius: '4px'   // lines 92, 124 — should be tokens.borders.radius.sm
```

**Impact**: Inconsistent rounding when the design system updates radius values.

---

#### 5. Hardcoded Box Shadow — `HardcodedCard.jsx:23`

**Severity**: MEDIUM

```jsx
boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
```

Should be `tokens.shadows.md` which has the exact same value. Using the token ensures the shadow updates globally when the design system evolves.

---

#### 6. Hardcoded Transitions — `HardcodedCard.jsx:26, 97`

**Severity**: MEDIUM

```jsx
transition: 'box-shadow 250ms ease-in-out'       // line 26 → tokens.transitions.normal
transition: 'background-color 150ms ease-in-out'  // line 97 → tokens.transitions.fast
```

---

#### 7. Hardcoded z-index — `HardcodedCard.jsx:115`

**Severity**: MEDIUM

```jsx
zIndex: 10  // line 115 → tokens.zIndex.dropdown
```

Hardcoded z-index values lead to z-index wars across components. The token system defines a clear stacking order.

---

## Token Mapping Summary

| Category | Violations | Token Coverage |
|----------|-----------|----------------|
| Colors | 11 instances | `tokens.colors.*` |
| Spacing | 10 instances | `tokens.spacing.*` |
| Font Sizes | 5 instances | `tokens.typography.fontSize.*` |
| Font Weight | 3 instances | `tokens.typography.fontWeight.*` |
| Border Radius | 4 instances | `tokens.borders.radius.*` |
| Box Shadow | 1 instance | `tokens.shadows.*` |
| Transitions | 2 instances | `tokens.transitions.*` |
| Z-Index | 1 instance | `tokens.zIndex.*` |
| **Total** | **37 violations** | |

## Recommendations

1. **Import and use tokens**: Replace all hardcoded values with token references:
   ```jsx
   import { tokens } from './tokens';
   // Before: backgroundColor: '#1a73e8'
   // After:  backgroundColor: tokens.colors.primary
   ```

2. **Fix near-miss colors**: Update `#333` → `tokens.colors.text.primary` and `#e0e0e0` → `tokens.colors.border.default` to use the actual token values.

3. **Resolve font weight mismatch**: Choose between `tokens.typography.fontWeight.medium` (500) or `bold` (700) — do not use the non-standard 600.

4. **Use rem for font sizes**: The tokens already use `rem` units. Switching from `px` to tokens will automatically improve accessibility.

5. **Consider CSS custom properties**: For better runtime theming support, expose tokens as CSS variables and reference them via `var(--color-primary)`.

---

*Report generated by frontend-dev:review*
