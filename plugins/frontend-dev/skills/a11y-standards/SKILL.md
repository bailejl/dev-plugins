---
name: a11y-standards
description: WCAG 2.1 AA requirements, ARIA roles and states, keyboard navigation, screen reader support, and accessible component patterns. Use when auditing accessibility or building accessible components.
user-invocable: false
---

# Accessibility Standards Knowledge Base

Reference guide for WCAG 2.1 AA requirements, ARIA, keyboard navigation, screen reader support, and accessible component patterns. Use this knowledge when auditing accessibility, scaffolding components, or reviewing frontend code.

---

## WCAG 2.1 AA Requirements

WCAG is organized into 4 principles (POUR): Perceivable, Operable, Understandable, Robust.

### Perceivable

Users must be able to perceive the information presented.

| Criterion | ID | Requirement |
|-----------|----|-------------|
| Non-text Content | 1.1.1 | All non-text content has a text alternative (alt text, labels, captions) |
| Captions (Prerecorded) | 1.2.2 | Prerecorded audio in video has captions |
| Audio Description | 1.2.5 | Prerecorded video has audio description |
| Info and Relationships | 1.3.1 | Information and structure are programmatically determinable (semantic HTML, ARIA) |
| Meaningful Sequence | 1.3.2 | Reading/navigation order is logical and intuitive |
| Sensory Characteristics | 1.3.3 | Instructions don't rely solely on shape, size, position, or sound |
| Orientation | 1.3.4 | Content doesn't restrict to a single display orientation |
| Input Purpose | 1.3.5 | Input fields that collect user info have programmatic purpose (`autocomplete`) |
| Use of Color | 1.4.1 | Color is not the only visual means of conveying information |
| Contrast (Minimum) | 1.4.3 | Text has ≥4.5:1 contrast (normal) or ≥3:1 (large: 18px+ or 14px+ bold) |
| Resize Text | 1.4.4 | Text can resize up to 200% without loss of content or function |
| Images of Text | 1.4.5 | Use real text instead of images of text (exceptions: logos) |
| Reflow | 1.4.10 | Content reflows at 320px width / 256px height without horizontal scroll |
| Non-text Contrast | 1.4.11 | UI components and graphics have ≥3:1 contrast against adjacent colors |
| Text Spacing | 1.4.12 | Content adapts to: line-height 1.5x, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em |
| Content on Hover/Focus | 1.4.13 | Hover/focus-triggered content is dismissible, hoverable, and persistent |

### Operable

Users must be able to operate the interface.

| Criterion | ID | Requirement |
|-----------|----|-------------|
| Keyboard | 2.1.1 | All functionality is available from a keyboard |
| No Keyboard Trap | 2.1.2 | Keyboard focus can always be moved away from any component |
| Character Key Shortcuts | 2.1.4 | Single-character key shortcuts can be turned off or remapped |
| Timing Adjustable | 2.2.1 | Time limits can be extended or turned off |
| Pause, Stop, Hide | 2.2.2 | Auto-moving/updating content can be paused, stopped, or hidden |
| Three Flashes | 2.3.1 | Content doesn't flash more than 3 times per second |
| Skip Navigation | 2.4.1 | Skip-to-content link is available to bypass repeated blocks |
| Page Titled | 2.4.2 | Pages have descriptive titles |
| Focus Order | 2.4.3 | Focus order preserves meaning and operability |
| Link Purpose | 2.4.4 | Link purpose is determinable from link text (or context) |
| Multiple Ways | 2.4.5 | Multiple ways to locate content (nav, search, sitemap) |
| Headings and Labels | 2.4.6 | Headings and labels describe the topic or purpose |
| Focus Visible | 2.4.7 | Keyboard focus indicator is visible |
| Pointer Gestures | 2.5.1 | Multi-point/path gestures have single-pointer alternatives |
| Pointer Cancellation | 2.5.2 | Actions triggered on up-event, not down-event (allows cancellation) |
| Label in Name | 2.5.3 | Accessible name contains the visible label text |
| Motion Actuation | 2.5.4 | Device motion actions have UI alternatives and can be disabled |

### Understandable

Users must be able to understand the information and operation.

| Criterion | ID | Requirement |
|-----------|----|-------------|
| Language of Page | 3.1.1 | Default language is programmatically set (`lang` attribute) |
| Language of Parts | 3.1.2 | Language changes within content are marked |
| On Focus | 3.2.1 | Focus doesn't trigger context changes |
| On Input | 3.2.2 | Input doesn't trigger unexpected context changes |
| Consistent Navigation | 3.2.3 | Navigation mechanisms are consistent across pages |
| Consistent Identification | 3.2.4 | Components with the same function are identified consistently |
| Error Identification | 3.3.1 | Errors are identified and described in text |
| Labels or Instructions | 3.3.2 | Labels or instructions are provided for user input |
| Error Suggestion | 3.3.3 | Error messages suggest corrections when possible |
| Error Prevention | 3.3.4 | Submissions involving legal/financial/data are reversible, verified, or confirmed |

### Robust

Content must be robust enough for assistive technologies.

| Criterion | ID | Requirement |
|-----------|----|-------------|
| Parsing | 4.1.1 | HTML is well-formed (unique IDs, proper nesting) |
| Name, Role, Value | 4.1.2 | All UI components have accessible name, role, and state |
| Status Messages | 4.1.3 | Status messages are programmatically announced without focus change |

---

## ARIA Roles, States, and Properties

### When to Use ARIA

**First rule of ARIA**: Don't use ARIA if you can use a native HTML element.

```html
<!-- BAD: ARIA button -->
<div role="button" tabindex="0" onclick="submit()">Submit</div>

<!-- GOOD: Native button -->
<button onclick="submit()">Submit</button>
```

Native HTML elements have built-in keyboard handling, roles, and states. ARIA is for when no native element exists (custom widgets).

### Common Roles

| Role | Use Case | Native Equivalent |
|------|----------|-------------------|
| `button` | Clickable trigger | `<button>` |
| `link` | Navigation | `<a href>` |
| `checkbox` | Toggle option | `<input type="checkbox">` |
| `radio` | Exclusive option | `<input type="radio">` |
| `tab`, `tablist`, `tabpanel` | Tab interface | None |
| `dialog` | Modal/dialog | `<dialog>` |
| `alert` | Important message | None |
| `status` | Status update | None |
| `menu`, `menuitem` | Action menu | None |
| `tree`, `treeitem` | Tree view | None |
| `grid`, `row`, `gridcell` | Data grid | `<table>` |
| `region` | Generic landmark | `<section>` with label |
| `navigation` | Nav landmark | `<nav>` |
| `banner` | Page header | `<header>` (top-level) |
| `main` | Main content | `<main>` |
| `contentinfo` | Page footer | `<footer>` (top-level) |
| `complementary` | Supporting content | `<aside>` |
| `search` | Search area | `<search>` (HTML5.2+) |

### Common States and Properties

| Attribute | Purpose | Values |
|-----------|---------|--------|
| `aria-label` | Accessible name (no visible label) | String |
| `aria-labelledby` | Accessible name (references visible element) | ID(s) |
| `aria-describedby` | Additional description | ID(s) |
| `aria-expanded` | Disclosure state | `true` / `false` |
| `aria-pressed` | Toggle button state | `true` / `false` / `mixed` |
| `aria-checked` | Checkbox/radio state | `true` / `false` / `mixed` |
| `aria-selected` | Selection state (tabs, options) | `true` / `false` |
| `aria-hidden` | Hidden from assistive tech | `true` / `false` |
| `aria-disabled` | Disabled state | `true` / `false` |
| `aria-required` | Required field | `true` / `false` |
| `aria-invalid` | Validation state | `true` / `false` / `grammar` / `spelling` |
| `aria-errormessage` | Error message reference | ID |
| `aria-live` | Live region update behavior | `polite` / `assertive` / `off` |
| `aria-busy` | Content being updated | `true` / `false` |
| `aria-current` | Current item indicator | `page` / `step` / `location` / `date` / `true` |
| `aria-haspopup` | Element opens a popup | `true` / `menu` / `listbox` / `tree` / `grid` / `dialog` |
| `aria-controls` | Element controls another | ID |
| `aria-owns` | Parent-child relationship override | ID(s) |
| `aria-modal` | Marks a dialog as modal | `true` |
| `aria-roledescription` | Custom role description | String |

---

## Keyboard Navigation Patterns

### Focus Management

| Pattern | Implementation |
|---------|----------------|
| **Tab**: Move to next focusable element | Native browser behavior — ensure `tabindex` is correct |
| **Shift+Tab**: Move to previous | Native — same as above |
| **Enter/Space**: Activate | Buttons handle both natively. Custom elements: handle `keydown` |
| **Escape**: Close/dismiss | Handle in modal, dropdown, popover, tooltip handlers |
| **Arrow keys**: Navigate within widget | Tabs, menus, radio groups, grids, trees |
| **Home/End**: First/last item | Lists, menus, tabs, sliders |

### Roving tabindex

For composite widgets (tabs, menus, radio groups), use roving tabindex:

```tsx
// Only the active item is in the tab order
items.map((item, i) => (
  <button
    key={item.id}
    role="tab"
    tabIndex={i === activeIndex ? 0 : -1}
    aria-selected={i === activeIndex}
    onKeyDown={(e) => {
      if (e.key === 'ArrowRight') setActiveIndex((activeIndex + 1) % items.length);
      if (e.key === 'ArrowLeft') setActiveIndex((activeIndex - 1 + items.length) % items.length);
      if (e.key === 'Home') setActiveIndex(0);
      if (e.key === 'End') setActiveIndex(items.length - 1);
    }}
  >
    {item.label}
  </button>
));
```

### Focus Trapping (Modals)

```tsx
function useFocusTrap(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      const focusable = container.querySelectorAll<HTMLElement>(focusableSelector);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}
```

---

## Screen Reader Support

### How Screen Readers Work

Screen readers traverse the **accessibility tree** (derived from the DOM). They announce:
1. **Role**: "button", "link", "heading level 2"
2. **Name**: The accessible name (text content, `aria-label`, `alt`, `<label>`)
3. **State**: "expanded", "checked", "disabled", "selected"
4. **Description**: Additional info from `aria-describedby`

### Accessible Name Computation (priority order)

1. `aria-labelledby` (references another element's text)
2. `aria-label` (direct string)
3. Native label association (`<label for>`, `<caption>`, `<legend>`, `<figcaption>`)
4. Text content (for `<button>`, `<a>`, heading elements)
5. `title` attribute (last resort — unreliable across browsers)
6. `placeholder` (not a label — don't rely on it)

### Live Regions

Announce dynamic content updates without moving focus.

```html
<!-- Polite: announces when user is idle (default for most updates) -->
<div aria-live="polite">3 items in cart</div>

<!-- Assertive: announces immediately, interrupting current speech -->
<div role="alert">Error: Payment failed. Please try again.</div>

<!-- Status: implicit aria-live="polite" -->
<div role="status">Search returned 42 results</div>
```

**Guidelines:**
- The live region element must exist in the DOM BEFORE the content changes
- Don't create and immediately populate a live region — the screen reader won't detect the change
- Use `aria-live="polite"` for most updates (cart count, search results, saved confirmation)
- Use `role="alert"` or `aria-live="assertive"` only for urgent messages (errors, warnings)
- Use `aria-atomic="true"` when the entire region should be re-read on any change

---

## Color Contrast

### Requirements

| Content Type | Minimum Ratio | WCAG Criterion |
|-------------|---------------|----------------|
| Normal text (< 18px or < 14px bold) | 4.5:1 | 1.4.3 AA |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 | 1.4.3 AA |
| UI components (borders, icons) | 3:1 | 1.4.11 AA |
| Focus indicators | 3:1 | 1.4.11 AA |
| Disabled elements | No requirement | — |
| Decorative elements | No requirement | — |

### Checking Contrast

Tools for contrast checking:
- Browser DevTools (Chrome, Firefox) show contrast ratios in the color picker
- axe-core / axe DevTools browser extension
- WebAIM Contrast Checker
- Stark (Figma plugin)

### Common Pitfalls

- **Light gray text on white** — `#999` on `#fff` = 2.85:1 (FAILS). Use `#767676` for 4.5:1.
- **Placeholder text** — Browsers default to light gray. If placeholder conveys information, ensure contrast.
- **Blue links on dark backgrounds** — Default blue `#0000ee` on `#333` = 3.36:1 (fails for normal text).
- **Error red** — `#ff0000` on white = 4:1 (fails). Use `#c00` or `#d32f2f` for better contrast.
- **Focus outline on varied backgrounds** — Use double-ring technique: dark outer + light inner outline.

---

## Form Accessibility

### Required Pattern

```html
<div>
  <label for="email">
    Email address
    <span aria-hidden="true">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    autocomplete="email"
    aria-describedby="email-hint"
  />
  <p id="email-hint">We'll never share your email.</p>
</div>
```

### Error Pattern

```html
<div>
  <label for="password">Password</label>
  <input
    id="password"
    type="password"
    aria-invalid="true"
    aria-errormessage="password-error"
    aria-describedby="password-requirements"
  />
  <p id="password-requirements">Must be at least 8 characters.</p>
  <p id="password-error" role="alert">
    Password is too short. Please enter at least 8 characters.
  </p>
</div>
```

### Fieldset and Legend (for groups)

```html
<fieldset>
  <legend>Shipping method</legend>
  <label>
    <input type="radio" name="shipping" value="standard" />
    Standard (5-7 days)
  </label>
  <label>
    <input type="radio" name="shipping" value="express" />
    Express (1-2 days)
  </label>
</fieldset>
```

---

## Accessible Component Patterns

### Modal / Dialog

```tsx
<dialog
  ref={dialogRef}
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Confirm deletion</h2>
  <p id="dialog-description">This action cannot be undone.</p>
  <button onClick={onConfirm}>Delete</button>
  <button onClick={onClose}>Cancel</button>
</dialog>
```

Requirements:
- Focus moves to dialog (or first focusable element inside) on open
- Focus is trapped within the dialog while open
- Escape key closes the dialog
- Focus returns to the trigger element on close
- Background content is inert (`inert` attribute or `aria-hidden`)

### Tabs

```tsx
<div role="tablist" aria-label="Settings sections">
  <button role="tab" aria-selected="true" aria-controls="panel-general" id="tab-general">
    General
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-security" id="tab-security" tabIndex={-1}>
    Security
  </button>
</div>
<div role="tabpanel" id="panel-general" aria-labelledby="tab-general">
  General settings content
</div>
<div role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden>
  Security settings content
</div>
```

Requirements:
- Arrow keys navigate between tabs (roving tabindex)
- Tab content is only shown for the selected tab
- Tab panels are labeled by their tab

### Accordion / Disclosure

```tsx
<div>
  <h3>
    <button
      aria-expanded={isOpen}
      aria-controls="section-1-content"
    >
      Section 1
    </button>
  </h3>
  <div id="section-1-content" role="region" aria-labelledby="section-1-heading" hidden={!isOpen}>
    Section content
  </div>
</div>
```

### Tooltip

```tsx
<button aria-describedby="tooltip-1">
  Settings
</button>
<div id="tooltip-1" role="tooltip" hidden={!showTooltip}>
  Manage your account settings
</div>
```

Requirements:
- Tooltip appears on hover AND focus
- Tooltip is dismissible with Escape
- Tooltip content is hoverable (user can move mouse over tooltip)
- Tooltip persists while trigger has focus

### Combobox / Autocomplete

```tsx
<div>
  <label for="search">Search users</label>
  <input
    id="search"
    role="combobox"
    aria-expanded={isOpen}
    aria-controls="search-listbox"
    aria-activedescendant={activeOptionId}
    aria-autocomplete="list"
  />
  <ul id="search-listbox" role="listbox" aria-label="Search results">
    {results.map(result => (
      <li
        key={result.id}
        id={`option-${result.id}`}
        role="option"
        aria-selected={result.id === activeId}
      >
        {result.name}
      </li>
    ))}
  </ul>
</div>
```

Requirements:
- Arrow keys navigate options
- Enter selects the active option
- Escape closes the listbox
- Screen reader announces the active option via `aria-activedescendant`
- Number of results is announced (via live region or `aria-live`)

---

## Testing Accessibility

### Automated Testing

- **axe-core**: Run in unit tests with `jest-axe` or `vitest-axe`
- **eslint-plugin-jsx-a11y**: Catch common issues at lint time
- **Lighthouse**: Audit pages in CI
- **Pa11y**: Command-line accessibility testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing Checklist

1. **Tab through the entire page** — can you reach and operate everything?
2. **Use screen reader** (VoiceOver on Mac, NVDA on Windows) — is everything announced?
3. **Zoom to 200%** — does the layout still work?
4. **Set text spacing overrides** — does content still fit?
5. **Turn off CSS** — is the content order logical?
6. **Check with high contrast mode** — is everything visible?
7. **Test with keyboard only** — no mouse/trackpad

### Automated tests catch ~30% of accessibility issues. Manual testing is required for full compliance.
