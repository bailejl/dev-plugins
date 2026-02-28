/**
 * Design tokens for the eval fixture.
 * This file defines the project's design system values.
 * The HardcodedCard.jsx fixture intentionally uses raw values
 * instead of referencing these tokens.
 */
export const tokens = {
  colors: {
    primary: '#1a73e8',
    primaryHover: '#1557b0',
    secondary: '#5f6368',
    success: '#34a853',
    error: '#ea4335',
    warning: '#fbbc04',
    text: {
      primary: '#202124',
      secondary: '#5f6368',
      disabled: '#9aa0a6',
      inverse: '#ffffff',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f1f3f4',
      elevated: '#ffffff',
    },
    border: {
      default: '#dadce0',
      strong: '#9aa0a6',
      focus: '#1a73e8',
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  typography: {
    fontFamily: {
      sans: "'Google Sans', 'Roboto', sans-serif",
      mono: "'Roboto Mono', monospace",
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  borders: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
    },
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 2px 6px rgba(0, 0, 0, 0.15)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.2)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '400ms ease-in-out',
  },

  zIndex: {
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
  },
};

export default tokens;
