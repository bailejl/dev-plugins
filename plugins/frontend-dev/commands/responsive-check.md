---
description: Audit responsive design covering media queries, viewport units, flexible layouts, touch targets, text scaling, images, and preference queries.
---

# Responsive Design Audit

You are a responsive design auditor. When this command is invoked, analyze CSS, styled-components, and layout code to identify responsive design issues. Produce a structured report with findings, severity, and fix suggestions.

## Scope

If the user specifies a file or directory, audit that scope. If no scope is given, ask:
- "Which component or directory should I audit for responsive design? Or should I audit the full `src/` tree?"

## Step 1: Detect Project Styling Approach

Before auditing, determine the styling setup:
- **Breakpoint definitions**: Find where breakpoints are defined (CSS custom properties, Sass variables, Tailwind config, JS constants, theme objects)
- **Styling method**: CSS Modules, Tailwind, styled-components, Emotion, plain CSS/SCSS, or a mix
- **Design system / theme**: Check for a theme provider or design token file that defines responsive values
- **CSS-in-JS theme breakpoints**: Check `ThemeProvider` or similar for breakpoint definitions

Record the project's breakpoint values for reference (e.g., `sm: 640px, md: 768px, lg: 1024px, xl: 1280px`).

## Step 2: Run Audit Checks

For every finding, record:
- **File and line number**
- **Category** (from the checks below)
- **Severity**: Critical / Major / Minor
- **Description**: The issue
- **Fix**: Concrete code suggestion

### 2.1 Media Queries

- [ ] **Breakpoint consistency**: All media queries use the project's defined breakpoints — no one-off values like `@media (max-width: 743px)` when the project uses `768px`
- [ ] **Mobile-first vs desktop-first**: Determine which pattern the project uses, then flag inconsistencies:
  - Mobile-first: `min-width` queries, smallest styles as default
  - Desktop-first: `max-width` queries, largest styles as default
  - Mixed: Flag as Major finding if pattern is inconsistent within the same component
- [ ] **Overlapping breakpoints**: Check for queries that overlap and may cause conflicts (e.g., `max-width: 768px` and `min-width: 768px` both active at 768px)
- [ ] **Missing breakpoints**: Components that only handle 2 of 4 defined breakpoints, leaving gaps
- [ ] **Query ordering**: In CSS files, media queries should be ordered consistently (ascending for mobile-first)

**Severity guide:**
- Major: Inconsistent mobile-first / desktop-first within same component
- Major: Overlapping breakpoints causing style conflicts
- Minor: One-off breakpoint values that should use defined tokens

### 2.2 Viewport Units and Sizing

- [ ] **`100vh` on mobile**: Flag use of `100vh` which doesn't account for mobile browser chrome. Suggest `100dvh` (dynamic viewport height) or a CSS custom property fallback.
- [ ] **`vw` without overflow handling**: `100vw` includes scrollbar width on desktop, causing horizontal overflow. Suggest `100%` or `overflow-x: hidden` on the container.
- [ ] **Fixed viewport dimensions**: `width: 100vw` or `height: 100vh` on non-root elements that could break on resize.
- [ ] **Zoom support**: Layouts should remain functional at 200% zoom (WCAG 1.4.4). Check that `overflow: hidden` isn't clipping content at zoom.

**Severity guide:**
- Major: `100vh` causing content to be hidden behind mobile browser UI
- Major: `100vw` causing horizontal scrollbar
- Minor: Viewport unit that works but could be more robust

### 2.3 Flexible Layouts

- [ ] **Fixed-width containers**: Elements with hardcoded `width` in pixels that should be `max-width`, `width: 100%`, or flex/grid
- [ ] **Flexbox/Grid usage**: Verify containers use `flex-wrap: wrap` where items should stack on small screens
- [ ] **Flex shrink/grow**: Check that flex items can shrink below their content size when needed (`min-width: 0` or `overflow: hidden`)
- [ ] **Grid auto-fit/auto-fill**: Grid layouts should use `auto-fit` or `auto-fill` with `minmax()` for responsive columns instead of fixed column counts
- [ ] **Aspect ratio preservation**: Images and media should maintain aspect ratio (use `aspect-ratio`, `object-fit`, or padding-bottom trick)
- [ ] **Container queries**: For component-level responsiveness, check if container queries (`@container`) would be more appropriate than viewport media queries

**Severity guide:**
- Critical: Fixed-width layout that overflows on mobile
- Major: No flex-wrap causing content overlap on narrow viewports
- Minor: Could benefit from container queries for better encapsulation

### 2.4 Touch Targets

- [ ] **Minimum size**: Interactive elements (buttons, links, inputs) must be at least **44x44 CSS pixels** (WCAG 2.5.5 AAA) or **24x24 CSS pixels** (WCAG 2.5.8 AA minimum)
- [ ] **Target spacing**: Adjacent touch targets should have at least **8px** gap to prevent mis-taps
- [ ] **Inline link density**: Paragraph text with dense inline links — verify sufficient padding/line-height
- [ ] **Icon buttons**: Buttons with only an icon should have sufficient padding to meet target size even if the icon is small

**Severity guide:**
- Critical: Primary action button below 24x24px
- Major: Navigation links below 44x44px on touch devices
- Minor: Secondary action slightly below 44x44px but above 24x24px

### 2.5 Text Scaling and Typography

- [ ] **Absolute font sizes**: Flag `font-size` set in `px` — should use `rem` or `em` for user scaling support
- [ ] **Line height**: Flag unitless `line-height` values below `1.5` for body text (WCAG 1.4.12)
- [ ] **Maximum line length**: Text containers should have a `max-width` (~65-80 characters) to maintain readability on wide screens
- [ ] **Text truncation**: `text-overflow: ellipsis` should have a way to reveal full content (tooltip, expand, etc.)
- [ ] **Viewport-based font sizes**: `font-size: 3vw` scales unpredictably — should use `clamp()` with min/max bounds
- [ ] **Minimum font size**: Flag text below `12px` / `0.75rem` on any breakpoint

**Severity guide:**
- Major: Font size in px preventing user scaling
- Major: Viewport-only font size with no bounds
- Minor: Line height slightly below 1.5 in non-body text

### 2.6 Images and Media

- [ ] **Responsive images**: `<img>` elements should use `max-width: 100%` and `height: auto` or be wrapped in a responsive container
- [ ] **`srcset` and `sizes`**: Large images should use `srcset` for resolution switching and `sizes` for viewport-based selection
- [ ] **`<picture>` for art direction**: Different crops/compositions for different viewports should use `<picture>` with `<source>` elements
- [ ] **Video responsiveness**: Videos should be wrapped in responsive containers (e.g., `aspect-ratio: 16/9` or padding-bottom technique)
- [ ] **SVG scaling**: SVGs should use `viewBox` and responsive width/height, not fixed dimensions

**Severity guide:**
- Major: Image overflows container on mobile (no `max-width: 100%`)
- Minor: Missing `srcset` for large hero images

### 2.7 Hardcoded Values

- [ ] **Pixel values in layout**: `width`, `height`, `padding`, `margin`, `gap` using raw pixel values instead of relative units, design tokens, or spacing scale values
- [ ] **Magic numbers**: Unexplained numeric values (e.g., `top: 73px`) — should use calc, variables, or be documented
- [ ] **Hardcoded colors**: Colors defined inline rather than using CSS custom properties or theme tokens (cross-reference with design-system command)
- [ ] **Z-index values**: Raw z-index numbers without a defined scale (e.g., `z-index: 9999`)

**Severity guide:**
- Major: Hardcoded pixel width on a layout container
- Minor: Hardcoded spacing that should use a token but doesn't break layout

### 2.8 Overflow and Scrolling

- [ ] **Horizontal overflow**: Check for elements that cause horizontal scrolling on narrow viewports (tables, code blocks, wide images, pre-formatted text)
- [ ] **Tables**: Wide tables should have a scrollable wrapper (`overflow-x: auto`) with proper indication
- [ ] **`overflow: hidden` masking issues**: Content cut off rather than reflowed — hidden overflow may mask layout bugs
- [ ] **Scroll behavior**: `scroll-behavior: smooth` should respect `prefers-reduced-motion`
- [ ] **Position fixed/sticky**: Verify fixed/sticky elements don't cover content on small screens

**Severity guide:**
- Critical: Page has horizontal scroll on mobile due to overflowing element
- Major: Table content inaccessible due to no scroll wrapper
- Minor: Fixed header covers too much screen real estate on small devices

### 2.9 Preference Queries

- [ ] **`prefers-reduced-motion`**: Animations and transitions should be disabled or reduced when this media feature is active
- [ ] **`prefers-color-scheme`**: If the app has dark/light mode, check it responds to system preference
- [ ] **`prefers-contrast`**: High-contrast mode should not break the layout
- [ ] **Print styles**: If relevant, check `@media print` styles exist for printable content

**Severity guide:**
- Major: Animations not respecting `prefers-reduced-motion` (accessibility concern)
- Minor: No print stylesheet for content likely to be printed

## Step 3: Produce the Report

```
# Responsive Design Audit Report

**Scope**: [files/directories audited]
**Date**: [current date]
**Breakpoint system**: [mobile-first / desktop-first] — [breakpoint values]

## Summary

| Category              | Critical | Major | Minor |
|-----------------------|----------|-------|-------|
| Media Queries         | X        | X     | X     |
| Viewport Units        | X        | X     | X     |
| Flexible Layouts      | X        | X     | X     |
| Touch Targets         | X        | X     | X     |
| Typography            | X        | X     | X     |
| Images & Media        | X        | X     | X     |
| Hardcoded Values      | X        | X     | X     |
| Overflow & Scrolling  | X        | X     | X     |
| Preference Queries    | X        | X     | X     |
| **Total**             | **X**    | **X** | **X** |

## Findings

### Critical

#### [R1] Fixed-width container overflows on mobile
- **File**: `src/components/Dashboard.tsx:88`
- **Category**: Flexible Layouts
- **Issue**: Container has `width: 1200px` with no responsive override. Overflows on viewports below 1200px.
- **Fix**:
  ```css
  /* Before */
  width: 1200px;

  /* After */
  max-width: 1200px;
  width: 100%;
  ```

### Major
[Same format]

### Minor
[Same format]

## Breakpoint Coverage

| Component       | sm (640) | md (768) | lg (1024) | xl (1280) |
|-----------------|----------|----------|-----------|-----------|
| Header          |    ✓     |    ✓     |     ✓     |     ✓     |
| Sidebar         |    ✗     |    ✓     |     ✓     |     ✓     |
| ProductCard     |    ✓     |    ✗     |     ✓     |     ✗     |

(✗ = no responsive styles for this breakpoint)
```

## Step 4: Fix Priority

```
## Recommended Fix Order

1. [R1] Fixed-width container — page broken on all mobile devices
2. [R5] Horizontal overflow on data table — blocks mobile users
3. [R2] Missing flex-wrap — navigation links overlap at md breakpoint
...
```

Prioritize by:
1. Content inaccessible or page broken (Critical)
2. Significant usability degradation (Major)
3. Visual polish and best practices (Minor)
