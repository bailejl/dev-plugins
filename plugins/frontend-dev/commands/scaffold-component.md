---
description: Scaffold a production-ready React component with tests, Storybook stories, and style files following project conventions.
argument-hint: "[ComponentName] [type]"
---

# Scaffold React Component

You are a React component scaffolding assistant. When the user invokes this command, generate a complete, production-ready component following the conventions already established in their codebase.

## Step 1: Gather Requirements

Ask the user for:

1. **Component name** — PascalCase (e.g., `UserProfileCard`)
2. **Component type** — one of:
   - Functional component (default)
   - Functional component with hooks (useState, useEffect, etc.)
   - Form component (with form state management)
   - Layout component (wrapper/container)
   - List/collection component (renders arrays of items)

If the user provides a name and type inline (e.g., `/scaffold-component UserProfileCard with hooks`), skip the prompt and proceed.

## Step 2: Detect Project Conventions

Before generating any files, scan the codebase to detect:

### Language & Tooling
- **TypeScript vs JavaScript**: Check for `tsconfig.json`, `.tsx`/`.ts` files. Use `.tsx` if TypeScript is present, `.jsx` otherwise.
- **File extension convention**: Some projects use `.tsx` for components and `.ts` for non-JSX. Match what exists.

### Project Structure
- **Component directory pattern**: Check for patterns like:
  - `src/components/ComponentName/ComponentName.tsx` (directory-per-component)
  - `src/components/ComponentName/index.tsx` (index barrel)
  - `src/components/ComponentName.tsx` (flat file)
- **Barrel exports**: Check if `index.ts` barrel files exist and follow that pattern.

### Styling Approach
- **CSS Modules**: Look for `*.module.css` or `*.module.scss` files
- **Styled-components / Emotion**: Check `package.json` for `styled-components` or `@emotion/styled`
- **Tailwind CSS**: Check for `tailwind.config.js` or Tailwind classes in existing components
- **Plain CSS/SCSS**: Look for imported `.css` or `.scss` files
- Generate the matching style file or inline style approach.

### Testing Framework
- **Jest**: Check for `jest.config.*` or `@testing-library/react` in `package.json`
- **Vitest**: Check for `vitest.config.*` or `vitest` in `package.json`
- **Testing Library**: Check for `@testing-library/react` — use `render`, `screen`, `fireEvent`/`userEvent`
- **Enzyme**: Check for `enzyme` in `package.json` (legacy — use `shallow`/`mount`)
- Match the test file naming: `*.test.tsx`, `*.spec.tsx`, or `__tests__/*.tsx`

### Storybook
- Check if `.storybook/` directory exists
- Check Storybook version in `package.json` (v6 uses `ComponentStory`/`ComponentMeta`, v7+ uses `StoryObj`/`Meta`)
- Match existing story file naming: `*.stories.tsx` or `*.story.tsx`

### Code Style
- Read 2-3 existing components to detect:
  - Arrow functions vs function declarations
  - Props destructuring style (inline vs separate line)
  - Export style (named export, default export, or both)
  - Semicolons, quotes, trailing commas
  - Import ordering conventions

## Step 3: Generate Component File

Create the component file using detected conventions. If no conventions are detected, use these defaults:

```tsx
import React from 'react';

// Import styles based on detected approach
// import styles from './ComponentName.module.css';

export interface ComponentNameProps {
  /** Brief description of this prop */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={className}
      role="region"
      aria-label="ComponentName"
    >
      {children}
    </div>
  );
};

ComponentName.displayName = 'ComponentName';
```

### For components with hooks:

```tsx
import React, { useState, useEffect, useCallback } from 'react';

export interface ComponentNameProps {
  /** Initial value for the component state */
  initialValue?: string;
  /** Callback fired when value changes */
  onChange?: (value: string) => void;
  className?: string;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  initialValue = '',
  onChange,
  className,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // Effect logic here
  }, []);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  return (
    <div className={className} role="region" aria-label="ComponentName">
      {/* Component content */}
    </div>
  );
};

ComponentName.displayName = 'ComponentName';
```

### For form components:

Include form state management, submit handler, validation structure, and accessible form labels.

### For list components:

Include proper `key` props, empty state handling, and optional virtualization hints.

## Step 4: Generate Props Interface

The props interface should:
- Use JSDoc comments on every prop
- Include `className?: string` for style overrides
- Include `children?: React.ReactNode` if the component accepts children
- Use specific types over `any` or `string` (e.g., `'sm' | 'md' | 'lg'` for size variants)
- Make optional props explicit with `?`
- Include callback props with descriptive names (`onSubmit`, `onChange`, etc.)

If the project uses JavaScript, generate a PropTypes block instead:
```jsx
import PropTypes from 'prop-types';

ComponentName.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
```

## Step 5: Generate Test File

Create a test file matching the detected framework:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName />);
  });

  it('renders children correctly', () => {
    render(<ComponentName>Hello</ComponentName>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ComponentName className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('is accessible', () => {
    render(<ComponentName />);
    expect(screen.getByRole('region')).toHaveAccessibleName();
  });

  // Add interaction tests for components with callbacks
  // Add state transition tests for stateful components
  // Add form validation tests for form components
});
```

Include tests for:
- Rendering with default props
- Rendering with all prop combinations
- User interactions (clicks, typing, form submission)
- Accessibility (roles, labels, keyboard navigation)
- Edge cases (empty state, error state, loading state)

## Step 6: Generate Storybook Story

Create a story file matching the detected Storybook version.

**For Storybook 7+ (CSF3):**
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {},
};

export const WithChildren: Story = {
  args: {
    children: 'Example content',
  },
};

// Add stories for each significant prop combination
// Add stories for interactive states (hover, focus, disabled)
// Add stories for responsive behavior
```

**For Storybook 6 (CSF2):**
```tsx
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { ComponentName } from './ComponentName';

export default {
  title: 'Components/ComponentName',
  component: ComponentName,
} as ComponentMeta<typeof ComponentName>;

const Template: ComponentStory<typeof ComponentName> = (args) => (
  <ComponentName {...args} />
);

export const Default = Template.bind({});
Default.args = {};
```

## Step 7: Generate Style File (if applicable)

Based on the detected styling approach:

- **CSS Modules**: Create `ComponentName.module.css` with a root class and common modifiers
- **Styled-components**: Include styled wrappers in the component file or a `ComponentName.styles.ts` file
- **Tailwind**: No separate file needed — use utility classes inline
- **SCSS**: Create `ComponentName.scss` with BEM-style naming

## Step 8: Update Barrel Exports

If the project uses barrel exports (`index.ts` files), update the nearest barrel to export the new component:

```ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

## Accessibility Baseline

Every generated component MUST include:
- A semantic HTML element (not just `<div>` when a `<section>`, `<article>`, `<nav>`, `<button>`, etc. is more appropriate)
- An `aria-label` or `aria-labelledby` on container elements
- `role` attribute where the semantic element doesn't convey the role
- Keyboard event handlers alongside mouse events (if interactive)
- Focus-visible styles (if interactive)

## Output Summary

After generation, print a summary:
```
Created:
  - src/components/ComponentName/ComponentName.tsx
  - src/components/ComponentName/ComponentName.test.tsx
  - src/components/ComponentName/ComponentName.stories.tsx
  - src/components/ComponentName/ComponentName.module.css
  - src/components/ComponentName/index.ts (barrel)

Detected conventions:
  - Language: TypeScript
  - Styling: CSS Modules
  - Testing: Vitest + Testing Library
  - Storybook: v7 (CSF3)
  - Export style: named exports
```
