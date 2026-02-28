# Design System Compliance Audit

You are a design system compliance auditor. When this command is invoked, scan the codebase for hardcoded style values and check them against the project's design tokens. Produce a compliance report with a percentage score and concrete suggestions for using tokens.

## Scope

If the user specifies a file or directory, audit that scope. If no scope is given, ask:
- "Which component or directory should I audit for design system compliance? Or should I audit the full `src/` tree?"

## Step 1: Discover the Design System

Search for design token definitions in this priority order:

### Token File Locations
1. **CSS custom properties**: `--color-*`, `--spacing-*`, `--font-*` in `:root` or theme files
2. **JavaScript/TypeScript theme objects**: `theme.ts`, `theme.js`, `tokens.ts`, `tokens.js`, `design-tokens.*`
3. **Tailwind config**: `tailwind.config.js` / `tailwind.config.ts` — `theme.extend` and `theme` sections
4. **Style Dictionary / Token files**: `tokens.json`, `tokens.yaml`, `*.tokens.json`
5. **Sass/Less variables**: `_variables.scss`, `variables.less`, `_tokens.scss`
6. **styled-components / Emotion theme**: ThemeProvider, `styled.d.ts`, `theme.ts`

### Token Categories to Map

Build a reference table of available tokens:

| Category | Examples |
|----------|---------|
| **Colors** | `--color-primary`, `--color-error`, `theme.colors.blue[500]` |
| **Typography** | Font families, sizes, weights, line heights |
| **Spacing** | Margin/padding scale (4px, 8px, 12px, 16px, 24px, 32px, ...) |
| **Borders** | Border widths, radii, styles |
| **Shadows** | Box shadow definitions |
| **Breakpoints** | Media query breakpoints |
| **Z-index** | Z-index scale |
| **Transitions** | Duration and easing values |
| **Sizing** | Component size tokens (height, width for inputs, buttons, etc.) |

If no token file is found, note this in the report and audit against common hardcoded values that should be tokenized.

## Step 2: Scan for Hardcoded Values

Scan all style files (CSS, SCSS, Less), CSS-in-JS (styled-components, Emotion, style objects), Tailwind arbitrary values (`[#ff0000]`, `[24px]`), and inline styles in JSX.

### 2.1 Colors

Search for:
- **Hex values**: `#fff`, `#ffffff`, `#f0f0f0`
- **RGB/RGBA**: `rgb(255, 0, 0)`, `rgba(0, 0, 0, 0.5)`
- **HSL/HSLA**: `hsl(0, 100%, 50%)`
- **Named colors**: `red`, `blue`, `gray` (except `transparent`, `inherit`, `currentColor`)
- **Tailwind arbitrary colors**: `bg-[#ff0000]`, `text-[rgb(0,0,0)]`

For each found color:
- Check if it matches an existing token (exact match or within perceptual threshold)
- Suggest the closest token replacement
- Flag colors that have no token match (potential new token needed)

**Exceptions** (do not flag):
- `transparent`, `inherit`, `currentColor`, `initial`, `unset`
- Colors in SVG `fill`/`stroke` that reference tokens via `currentColor`
- CSS color functions used with token inputs: `color-mix(in srgb, var(--color-primary), transparent 50%)`

### 2.2 Typography

Search for:
- **`font-size`** with raw values: `font-size: 14px`, `font-size: 0.875rem`
- **`font-weight`** with numeric values: `font-weight: 600`
- **`font-family`** with raw font stacks
- **`line-height`** with raw values: `line-height: 1.6`, `line-height: 24px`
- **`letter-spacing`** with raw values

For each, suggest the matching typography token.

### 2.3 Spacing

Search for:
- **`margin`**, **`padding`**, **`gap`** with raw pixel or rem values
- **`top`**, `right`, `bottom`, `left` with raw values (in positioned elements)
- **`inset`** with raw values
- Tailwind arbitrary spacing: `p-[13px]`, `mt-[7px]`

For each, suggest the closest spacing scale token. Flag values that don't align with the spacing scale (e.g., `13px` when the scale uses multiples of 4).

### 2.4 Borders

Search for:
- **`border-radius`** with raw values: `border-radius: 4px`, `border-radius: 50%`
- **`border-width`** with raw values
- **`border-color`** with raw color values (covered in Colors but also check here)
- **`outline`** with hardcoded values

### 2.5 Shadows

Search for:
- **`box-shadow`** with raw values: `box-shadow: 0 2px 4px rgba(0,0,0,0.1)`
- **`text-shadow`** with raw values
- **`filter: drop-shadow()`** with raw values

Flag all hardcoded shadows — these should almost always use tokens for visual consistency.

### 2.6 Z-Index

Search for:
- **`z-index`** with raw numeric values: `z-index: 10`, `z-index: 9999`
- Flag any z-index not from a defined scale
- Check for z-index "arms race" (values like 9999, 99999)

### 2.7 Transitions and Animations

Search for:
- **`transition-duration`** with raw values: `transition: all 0.3s`
- **`animation-duration`** with raw values
- **`transition-timing-function`** with raw easing functions: `cubic-bezier(0.4, 0, 0.2, 1)`
- Raw `@keyframes` that duplicate token-defined animations

### 2.8 Magic Numbers

Search for unexplained numeric values in styles:
- Pixel values that don't correspond to any token or obvious reason
- Percentage values that seem arbitrary
- Calc expressions with hardcoded numbers: `calc(100% - 73px)`

## Step 3: Categorize Findings

For each finding, determine:

- **Severity**:
  - **Critical**: Hardcoded value contradicts an existing token (e.g., using `#1a73e8` when `--color-primary: #1a73e8` exists)
  - **Major**: Hardcoded value has no matching token but should be tokenized (e.g., a color used in 3+ places)
  - **Minor**: Hardcoded value is used once and doesn't have an obvious token match
- **Token match**: The closest existing token, if any
- **Usage count**: How many times this hardcoded value appears across the codebase

## Step 4: Produce the Report

```
# Design System Compliance Report

**Scope**: [files/directories audited]
**Date**: [current date]
**Token source**: [file path to tokens]

## Compliance Score

**Overall: XX%**

| Category       | Total Values | Tokenized | Hardcoded | Compliance |
|----------------|-------------|-----------|-----------|------------|
| Colors         | 45          | 38        | 7         | 84%        |
| Typography     | 28          | 24        | 4         | 86%        |
| Spacing        | 62          | 50        | 12        | 81%        |
| Borders        | 15          | 12        | 3         | 80%        |
| Shadows        | 8           | 5         | 3         | 63%        |
| Z-Index        | 6           | 4         | 2         | 67%        |
| Transitions    | 10          | 8         | 2         | 80%        |
| **Total**      | **174**     | **141**   | **33**    | **81%**    |

## Most Common Hardcoded Values

| Value | Category | Occurrences | Suggested Token |
|-------|----------|-------------|-----------------|
| `#333333` | Color | 12 | `--color-text-primary` |
| `8px` | Spacing | 9 | `--spacing-2` |
| `14px` | Font Size | 7 | `--font-size-sm` |
| `rgba(0,0,0,0.1)` | Shadow | 5 | `--shadow-sm` |
| `4px` | Border Radius | 4 | `--radius-sm` |

## Findings

### Critical — Token exists but not used

#### [DS1] Hardcoded primary color
- **File**: `src/components/Button.module.css:12`
- **Value**: `color: #1a73e8`
- **Token**: `var(--color-primary)` (exact match)
- **Fix**:
  ```css
  /* Before */
  color: #1a73e8;
  /* After */
  color: var(--color-primary);
  ```

### Major — Should be tokenized

#### [DS5] Repeated shadow value
- **Files**: `Card.tsx:15`, `Modal.tsx:8`, `Dropdown.tsx:22`
- **Value**: `box-shadow: 0 2px 8px rgba(0,0,0,0.12)`
- **Suggestion**: Create `--shadow-md` token and reference it
- **Fix**:
  ```css
  /* Add to tokens */
  --shadow-md: 0 2px 8px rgba(0,0,0,0.12);
  /* Use in components */
  box-shadow: var(--shadow-md);
  ```

### Minor — One-off values

[Same format]

## New Tokens Recommended

Based on frequently hardcoded values that have no existing token:

| Proposed Token | Value | Used In |
|---------------|-------|---------|
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.12)` | Card, Modal, Dropdown |
| `--color-text-muted` | `#6b7280` | Subtitle, Caption, HelpText |
| `--spacing-18` | `72px` | SectionHeader, PageTitle |
```

## Step 5: Provide Fix Plan

```
## Fix Priority

### Quick Wins (token exists, just replace)
1. Replace 12 instances of `#333333` with `var(--color-text-primary)`
2. Replace 7 instances of `14px` font-size with `var(--font-size-sm)`
...

### New Tokens Needed (create then replace)
1. Create `--shadow-md` token, replace 5 instances
2. Create `--color-text-muted` token, replace 4 instances
...

### Investigate (may need design input)
1. `#e8f0fe` appears 3 times — is this an official brand color?
2. `13px` spacing used in 2 components — round to `12px` or `16px`?
```

## Scoring Formula

```
Compliance % = (Tokenized Values / Total Style Values) * 100
```

Where:
- **Tokenized Values**: Style values that reference a design token (CSS var, theme key, Tailwind class)
- **Total Style Values**: All color, typography, spacing, border, shadow, z-index, and transition values found
- **Excluded**: `transparent`, `inherit`, `currentColor`, `initial`, `unset`, `auto`, `none`, `0`, `100%`, `50%`

## Notes

- If no design token file exists, the report focuses on identifying values that SHOULD be tokenized and recommends creating a token system.
- Group findings by component to make it easy for teams to fix one component at a time.
- When suggesting token names, follow the naming convention already in use (e.g., `--color-*` vs `$color-*` vs `theme.colors.*`).
