import { useState } from 'react';

/**
 * BadForm — a form component with numerous accessibility violations.
 * Used as a fixture for a11y-audit evals.
 *
 * Violations present:
 * 1. Inputs without associated labels (1.3.1, 4.1.2)
 * 2. Placeholder used as only label (3.3.2)
 * 3. Error messages not associated with fields (3.3.1)
 * 4. Custom "button" is a div with onClick but no keyboard handler (2.1.1)
 * 5. No autocomplete attributes on email/password (1.3.5)
 * 6. Required fields not marked (3.3.2)
 * 7. Missing form element (no <form>) (1.3.1)
 * 8. Color-only error indication (1.4.1)
 * 9. Heading skip: h1 -> h4 (1.3.1)
 * 10. No focus management after error
 */
export function BadForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    // submit logic
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <h4>Create your account</h4>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <input
          type="text"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <input type="checkbox" />
        <span>I agree to the terms</span>
      </div>

      <div
        style={{
          padding: '10px 20px',
          backgroundColor: '#1a73e8',
          color: 'white',
          cursor: 'pointer',
          borderRadius: '4px',
          display: 'inline-block',
        }}
        onClick={handleSubmit}
      >
        Create Account
      </div>
    </div>
  );
}

export default BadForm;
