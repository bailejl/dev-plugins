/**
 * Reference solution: Scaffolded Button component.
 * This is the expected output quality for /frontend-dev:scaffold-component
 * when asked to create a Button with variant prop.
 */

// --- Button.tsx ---

import React from 'react';

/**
 * Props for the Button component.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Button content */
  children: React.ReactNode;
}

/**
 * A reusable button component with variant styles.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className,
  type = 'button',
  disabled,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className || ''}`.trim()}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {children}
    </button>
  );
};

Button.displayName = 'Button';

// --- Button.test.tsx ---

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('defaults to primary variant', () => {
    const { container } = render(<Button>Test</Button>);
    expect(container.firstChild).toHaveClass('btn--primary');
  });

  it('applies variant class', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass('btn--danger');
  });

  it('defaults to type="button"', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not fire click when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom">Test</Button>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards additional HTML attributes', () => {
    render(<Button data-testid="my-btn">Test</Button>);
    expect(screen.getByTestId('my-btn')).toBeInTheDocument();
  });
});

// --- Button.stories.tsx ---

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled',
    disabled: true,
  },
};
