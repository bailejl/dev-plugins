# CSS Architecture Knowledge Base

Reference guide for CSS methodologies, tooling, responsive design, and layout patterns. Use this knowledge when auditing styles, scaffolding components, or advising on CSS architecture decisions.

---

## Naming Conventions

### BEM (Block Element Modifier)

```css
/* Block */
.card { }

/* Element (part of the block) */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier (variation of block or element) */
.card--featured { }
.card__header--large { }
```

**Guidelines:**
- Block: Standalone, meaningful component name
- Element: Part of a block, separated by `__` (double underscore)
- Modifier: Variation of a block/element, separated by `--` (double hyphen)
- Never nest BEM elements: `.card__header__title` is wrong — use `.card__title`
- Modifiers don't replace the base class: `class="card card--featured"`, not just `class="card--featured"`
- Keep blocks flat (1-2 levels of elements max)

### SMACSS Categories

- **Base**: Default styles for HTML elements (`body`, `h1`, `a`)
- **Layout**: Major structural sections (`.l-header`, `.l-sidebar`)
- **Module**: Reusable components (`.card`, `.nav`, `.modal`)
- **State**: States that augment modules (`.is-active`, `.is-hidden`)
- **Theme**: Visual overrides for themes (`.theme-dark .card`)

---

## CSS Modules

Locally scoped CSS. Class names are transformed at build time to be unique.

```css
/* Button.module.css */
.root {
  padding: 8px 16px;
  border-radius: 4px;
}

.primary {
  background: var(--color-primary);
  color: white;
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

```tsx
import styles from './Button.module.css';
import clsx from 'clsx';

function Button({ variant, disabled, children }) {
  return (
    <button
      className={clsx(styles.root, styles[variant], disabled && styles.disabled)}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

**Guidelines:**
- Use generic class names (`.root`, `.title`, `.active`) — they're scoped, so no collision risk
- Use `composes` for sharing styles between modules: `composes: baseButton from './shared.module.css';`
- Use `clsx` or `classnames` for conditional class composition
- CSS Modules work with CSS, SCSS, and Less
- Global styles can be escaped with `:global(.className)`

---

## Tailwind CSS

Utility-first CSS framework.

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Submit
</button>
```

**Guidelines:**
- Keep utility strings manageable — extract to components, not to `@apply` classes
- `@apply` should be a last resort (it negates utility-first benefits). Prefer component abstraction.
- Use the theme config for project-specific values instead of arbitrary values `[24px]`
- Arbitrary values are acceptable for one-off needs but flag them in audits if overused
- Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes (mobile-first)
- State: `hover:`, `focus:`, `active:`, `disabled:`, `group-hover:`
- Dark mode: `dark:` prefix (with `darkMode: 'class'` or `'media'`)
- Use `cn()` utility (clsx + twMerge) for conditional classes that need proper merge behavior

### Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      spacing: {
        18: '4.5rem',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

---

## CSS-in-JS

### styled-components / Emotion

```tsx
import styled from 'styled-components';

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.secondary};
  color: white;
  transition: background 150ms ease;

  &:hover {
    opacity: 0.9;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;
```

**Guidelines:**
- Use transient props (`$variant`) to prevent DOM leaking (styled-components v5.1+)
- Access theme values via the theme prop or `useTheme()` hook
- Avoid complex logic in template literals — extract to helper functions
- `css` prop (Emotion) is lighter weight than `styled` for one-off styles
- Be aware of SSR considerations — both libraries support SSR but require setup

### Style Objects (inline styles, style prop)

```tsx
const styles = {
  container: {
    display: 'flex',
    gap: '16px',
    padding: '24px',
  } satisfies React.CSSProperties,
};
```

**Guidelines:**
- Cannot use pseudo-classes (`:hover`), pseudo-elements (`::before`), media queries, or keyframes
- Useful for truly dynamic styles (values computed from state/props)
- Prefer CSS-based solutions for anything involving hover, focus, responsive, or animation

---

## Responsive Design

### Mobile-First

Start with mobile styles as the default, then layer on complexity at wider viewpoints.

```css
/* Default (mobile) */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Why mobile-first:**
- Forces prioritization of content
- Progressive enhancement (add complexity as viewport grows)
- Mobile devices parse less CSS (skip desktop media queries)
- Aligns with responsive image loading patterns

### Common Breakpoints

| Name | Width | Typical Device |
|------|-------|---------------|
| `xs` | < 640px | Small phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets (portrait) |
| `lg` | 1024px | Tablets (landscape), small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

These are guidelines — adjust to your content. The best breakpoints are where your layout breaks, not at arbitrary device widths.

### Container Queries

Component-level responsiveness based on container size, not viewport.

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
```

**When to use**: Reusable components placed in different-width containers (sidebar vs. main content).

### Fluid Typography with clamp()

```css
/* Font size scales between 1rem (16px) and 2rem (32px) */
h1 {
  font-size: clamp(1rem, 2.5vw + 0.5rem, 2rem);
}

/* Fluid spacing */
.section {
  padding: clamp(1rem, 5vw, 4rem);
}
```

**Formula**: `clamp(min, preferred, max)` where preferred typically includes a `vw` unit.

---

## CSS Custom Properties (Design Tokens)

```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-border: #e5e7eb;
  --color-error: #ef4444;
  --color-success: #22c55e;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;

  /* Spacing (4px grid) */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* Borders */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Z-index scale */
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-popover: 50;
  --z-toast: 60;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode override */
[data-theme='dark'] {
  --color-text: #f9fafb;
  --color-bg: #111827;
  --color-bg-secondary: #1f2937;
  --color-border: #374151;
}
```

**Guidelines:**
- Custom properties cascade and can be overridden in any scope
- Use `var(--token, fallback)` for resilience: `color: var(--color-primary, #3b82f6);`
- Define tokens at `:root` for global scope
- Override tokens on component classes for theme variants
- Custom properties are runtime values — they work with media queries and JavaScript

---

## Layout Patterns

### Flexbox

```css
/* Center content */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Space between with wrap */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-4);
}

/* Sticky footer layout */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
.page__content {
  flex: 1;
}
```

### CSS Grid

```css
/* Responsive grid with auto-fit */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-6);
}

/* Holy grail layout */
.layout {
  display: grid;
  grid-template-columns: 250px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  min-height: 100dvh;
}

/* Responsive: collapse to single column */
@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
  }
}
```

### Common Patterns

**Sidebar layout (flex):**
```css
.sidebar-layout {
  display: flex;
  gap: var(--spacing-6);
}
.sidebar {
  flex: 0 0 250px; /* fixed width */
}
.main {
  flex: 1;
  min-width: 0; /* prevent overflow */
}
```

**Aspect ratio containers:**
```css
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.square-avatar {
  aspect-ratio: 1;
  width: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
}
```

**Scroll containers:**
```css
.scroll-area {
  overflow-y: auto;
  overscroll-behavior: contain; /* prevent scroll chaining */
  -webkit-overflow-scrolling: touch;
}
```

---

## Accessibility in CSS

### Focus Styles

```css
/* Modern focus-visible (only on keyboard navigation) */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default outline only when focus-visible is supported */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Screen Reader Utilities

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### High Contrast

```css
@media (prefers-contrast: high) {
  :root {
    --color-border: #000000;
    --color-text: #000000;
    --color-bg: #ffffff;
  }
}
```
