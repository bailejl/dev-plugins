# frontend-dev

React component scaffolding, accessibility audits, responsive design checks, refactoring, and design system compliance — all as Claude Code plugin commands.

## Commands

### `/frontend-dev:scaffold-component`

Scaffold a production-ready React component with tests, Storybook stories, and style files.

```
/frontend-dev:scaffold-component UserProfileCard with hooks
```

What it does:
- Detects your project's conventions (TypeScript/JS, styling approach, test framework, Storybook version)
- Generates the component file with proper types and accessibility attributes
- Generates a test file using your project's testing framework
- Generates a Storybook story file matching your Storybook version
- Generates a style file matching your CSS approach
- Updates barrel exports if your project uses them

### `/frontend-dev:a11y-audit`

Run a WCAG 2.1 AA compliance audit on your components.

```
/frontend-dev:a11y-audit src/components/Modal.tsx
/frontend-dev:a11y-audit src/components/
```

Checks for:
- Missing alt text, ARIA labels, and accessible names
- Keyboard navigation issues and keyboard traps
- Focus management problems
- Color contrast violations
- Form labeling and error handling
- Heading hierarchy and landmark regions
- Dynamic content announcement
- Touch target sizing

Produces a severity-rated report (Critical/Major/Minor) with specific file:line references and concrete code fixes.

### `/frontend-dev:responsive-check`

Audit responsive design patterns in your CSS and components.

```
/frontend-dev:responsive-check src/pages/Dashboard.tsx
/frontend-dev:responsive-check src/
```

Checks for:
- Breakpoint consistency and mobile-first/desktop-first pattern adherence
- Viewport unit issues (`100vh` on mobile, `100vw` scrollbar problems)
- Fixed-width layouts that overflow on narrow viewports
- Touch target minimum sizes (44x44px)
- Font sizes in px instead of rem
- Image responsiveness
- Horizontal overflow issues
- `prefers-reduced-motion` support

### `/frontend-dev:refactor`

Analyze and refactor React components for reduced complexity.

```
/frontend-dev:refactor src/components/UserProfile.tsx
```

Identifies:
- God components with too many responsibilities
- Mixed concerns (data fetching + rendering)
- Prop drilling and state management issues
- Duplicated logic across components
- Performance anti-patterns

Applies refactorings:
- Extract sub-components
- Extract custom hooks
- Replace derived state with computed values
- Simplify conditional rendering
- Consolidate state with useReducer

### `/frontend-dev:design-system`

Check design system compliance — find hardcoded values that should use tokens.

```
/frontend-dev:design-system src/components/
```

Scans for:
- Hardcoded colors (hex, rgb, hsl, named)
- Raw font sizes, weights, and families
- Pixel spacing values not on the spacing scale
- Hardcoded border radii, shadows, and z-index values
- Magic numbers in styles

Produces a compliance percentage score and maps each hardcoded value to the closest available design token.

## Agent

### `frontend-reviewer`

A holistic frontend review agent that combines all five command capabilities. Use it for comprehensive code reviews.

The agent:
1. Reads your project config to understand conventions
2. Decides which audits are relevant based on the code
3. Runs component quality, accessibility, responsive, design system, and refactoring analyses
4. Produces a unified report with scores, prioritized findings, and positive observations

## Skills

The plugin includes three knowledge bases that inform the commands and agent:

- **react-patterns** — Hooks, composition patterns, state management, performance optimization, server/client components
- **css-architecture** — BEM, CSS Modules, Tailwind, CSS-in-JS, responsive design, layout patterns, design tokens
- **a11y-standards** — WCAG 2.1 AA requirements, ARIA roles/states/properties, keyboard navigation, screen reader support, accessible component patterns

## Hooks

| Hook | Command | Description |
|------|---------|-------------|
| `pre-commit` | `npx eslint --fix` | Auto-fix lint issues before commit |
| `post-scaffold` | `npx prettier --write` | Format scaffolded files |

## Installation

Add the plugin to your Claude Code configuration:

```json
{
  "plugins": ["./plugins/frontend-dev"]
}
```

## Configuration

The plugin auto-detects project conventions from your existing codebase. It looks for:

- `tsconfig.json` — TypeScript configuration
- `package.json` — Dependencies and scripts
- `tailwind.config.*` — Tailwind CSS setup
- `.storybook/` — Storybook configuration
- `jest.config.*` / `vitest.config.*` — Test framework
- Theme/token files — Design system tokens

No manual configuration is required. The plugin adapts to your project's existing patterns.
