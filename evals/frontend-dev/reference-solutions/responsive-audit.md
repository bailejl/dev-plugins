# Responsive Design Audit — responsive-broken fixture

## Summary

The `DesktopGrid` component (`fixtures/responsive-broken/src/DesktopGrid.jsx`) has severe responsive design violations. The layout is hardcoded for desktop viewports and will overflow, break, or become unusable on tablets and mobile devices.

## Findings

### Critical

#### 1. Fixed Container Width — `DesktopGrid.jsx:28`

**Severity**: CRITICAL

```jsx
<div style={{ width: '1200px', margin: '0 auto', height: '100vh' }}>
```

The root container has a fixed `width: 1200px`. On any viewport narrower than 1200px, the content overflows horizontally, requiring users to scroll sideways.

**Fix**: Use `max-width` with a fluid fallback:
```jsx
<div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', minHeight: '100vh' }}>
```

---

#### 2. No Media Queries / Responsive Breakpoints — `DesktopGrid.jsx:47-53`

**Severity**: CRITICAL

The grid uses a fixed 3-column layout with no responsive adjustments:

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '24px',
}}>
```

On mobile screens (< 768px), three columns are too narrow to display card content. On tablets (768-1024px), the layout is cramped.

**Fix**: Use CSS media queries or a responsive grid approach:
```css
/* Mobile: single column */
grid-template-columns: 1fr;

/* Tablet: 2 columns */
@media (min-width: 768px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}
```

---

#### 3. Fixed Pixel Widths on Cards — `DesktopGrid.jsx:58, 69`

**Severity**: CRITICAL

Cards and images have hardcoded pixel widths:

```jsx
// Card: line 58
style={{ width: '360px', padding: '24px', ... }}

// Image: line 69
style={{ width: '360px', height: '200px', objectFit: 'cover' }}
```

Fixed widths prevent cards from adapting to their container. On narrow viewports, cards overflow their grid cells.

**Fix**: Use relative widths:
```jsx
// Card
style={{ width: '100%', padding: '24px', ... }}

// Image
style={{ width: '100%', maxWidth: '100%', height: 'auto', aspectRatio: '16/9', objectFit: 'cover' }}
```

---

### High

#### 4. Hardcoded `100vh` — `DesktopGrid.jsx:28`

**Severity**: HIGH

```jsx
<div style={{ width: '1200px', margin: '0 auto', height: '100vh' }}>
```

Using `height: 100vh` on mobile browsers causes content to be hidden behind the browser chrome (address bar, bottom toolbar). The viewport height on mobile includes the browser UI, but `100vh` is calculated from the full screen height.

**Fix**: Use `min-height: 100dvh` (dynamic viewport height) or omit the fixed height entirely:
```jsx
style={{ minHeight: '100dvh' }}
```

---

#### 5. Small Touch Targets — `DesktopGrid.jsx:76-84`

**Severity**: HIGH

Navigation links and card links have no padding, making them difficult to tap on touch devices:

```jsx
// Navigation links (lines 31-37)
<a href="/" style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>Home</a>

// Card links (lines 76-84)
<a href={item.link} style={{ fontSize: '14px', color: '#1a73e8', textDecoration: 'none' }}>
  View details →
</a>
```

WCAG 2.5.8 recommends a minimum touch target size of 44x44 CSS pixels. These links have no padding, making the touch target only as tall as the text (~20px).

**Fix**: Add padding to interactive elements:
```jsx
<a href={item.link} style={{
  display: 'inline-block',
  padding: '12px 0',
  fontSize: '1rem',
  minHeight: '44px',
  ...
}}>
```

---

#### 6. No Responsive Font Sizes — `DesktopGrid.jsx:39, 42, 71, 79`

**Severity**: HIGH

All font sizes use fixed pixel values:

```jsx
fontSize: '32px'  // h1, line 39
fontSize: '16px'  // body text, line 42
fontSize: '20px'  // card title, line 71
fontSize: '14px'  // card text, links, line 79
fontSize: '12px'  // footer, line 90
```

Pixel font sizes don't respect user browser settings for text scaling and don't adapt across viewport sizes.

**Fix**: Use `rem` units (or `clamp()` for fluid scaling):
```jsx
fontSize: '2rem'      // h1
fontSize: '1rem'      // body
fontSize: '1.25rem'   // card title
fontSize: '0.875rem'  // card text
fontSize: '0.75rem'   // footer

// Or fluid: clamp(1.5rem, 2vw + 1rem, 2rem) for the h1
```

---

### Medium

#### 7. No `flex-wrap` on Navigation — `DesktopGrid.jsx:30`

**Severity**: MEDIUM

```jsx
<nav style={{ display: 'flex', gap: '24px', padding: '16px 0', ... }}>
```

The navigation uses `display: flex` without `flex-wrap: wrap`. On narrow viewports, links overflow horizontally instead of wrapping to a new line.

**Fix**: Add `flexWrap: 'wrap'` and consider a hamburger menu for mobile.

---

#### 8. Images Without `max-width: 100%` — `DesktopGrid.jsx:69`

**Severity**: MEDIUM

```jsx
<img src={item.image} alt={item.title} style={{ width: '360px', height: '200px', objectFit: 'cover' }} />
```

Images have fixed pixel dimensions and no `max-width: 100%`, so they overflow their containers on smaller viewports.

**Fix**: Use `width: '100%'` and `maxWidth: '100%'` with `height: 'auto'`.

---

#### 9. Hardcoded Spacing Values — Throughout

**Severity**: MEDIUM

Spacing values are hardcoded pixels (`16px`, `24px`, `32px`, `48px`) throughout the component. On smaller viewports, these spacing values consume proportionally more screen real estate.

**Fix**: Use relative spacing (e.g., CSS custom properties or `clamp()`) that scales with viewport width, or reduce spacing at mobile breakpoints.

---

## Recommendations

1. **Replace fixed widths** with `max-width` + `width: 100%` on the container, cards, and images.
2. **Add CSS media queries** at 768px and 1024px breakpoints for grid column count.
3. **Use `rem` units** for all font sizes to respect user text scaling.
4. **Replace `100vh`** with `100dvh` or `min-height` to handle mobile browser chrome.
5. **Add padding to touch targets** to meet the 44x44px minimum.
6. **Add `flex-wrap: wrap`** to the navigation bar.
7. **Use fluid spacing** with `clamp()` or reduce spacing at smaller breakpoints.

---

*Report generated by frontend-dev:review*
