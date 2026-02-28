/**
 * Reference solution: Fixed version of BadForm.jsx
 * This is the expected output quality for /frontend-dev:a11y-audit
 * when asked to fix the accessibility violations in BadForm.
 *
 * Fixes applied:
 * 1. Added visible <label> elements for all inputs
 * 2. Used <form> element with onSubmit
 * 3. Added autocomplete attributes
 * 4. Associated error messages with aria-errormessage / aria-describedby
 * 5. Replaced div "button" with real <button>
 * 6. Added keyboard support (form submit handles Enter natively)
 * 7. Marked required fields with aria-required and visual indicator
 * 8. Fixed heading hierarchy (h1 -> h2)
 * 9. Error message uses role="alert" for screen reader announcement
 * 10. Checkbox has proper label association
 * 11. Color is not the only error indicator (added icon and text)
 * 12. Focus management on error
 */
import { useState, useRef } from 'react';

export function GoodForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Focus the first field with an error
      const firstErrorField = formRef.current?.querySelector('[aria-invalid="true"]');
      firstErrorField?.focus();
      return;
    }

    // Submit logic
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <h1>Sign Up</h1>
      <h2>Create your account</h2>

      {hasErrors && (
        <div role="alert" style={{ color: '#c62828', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px', marginBottom: '16px' }}>
          <strong>⚠ Please fix the following errors:</strong>
          <ul>
            {Object.values(errors).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="name">
          Full Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-errormessage={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert" style={{ color: '#c62828', fontSize: '14px', margin: '4px 0 0' }}>
            ⚠ {errors.name}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="email">
          Email Address <span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-errormessage={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" role="alert" style={{ color: '#c62828', fontSize: '14px', margin: '4px 0 0' }}>
            ⚠ {errors.email}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="password">
          Password <span aria-hidden="true">*</span>
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-errormessage={errors.password ? 'password-error' : undefined}
          aria-describedby="password-hint"
        />
        <p id="password-hint" style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>
          Must be at least 8 characters
        </p>
        {errors.password && (
          <p id="password-error" role="alert" style={{ color: '#c62828', fontSize: '14px', margin: '4px 0 0' }}>
            ⚠ {errors.password}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label htmlFor="agree-terms" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            id="agree-terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          I agree to the terms and conditions
        </label>
      </div>

      <button
        type="submit"
        style={{
          padding: '12px 24px',
          backgroundColor: '#1a73e8',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Create Account
      </button>
    </form>
  );
}

export default GoodForm;
