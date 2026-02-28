'use strict';

const { isValidEmail, isValidPhone, isValidUrl } = require('../src/validator');

// Only happy path tests, no edge cases or error scenarios

test('valid email', () => {
  expect(isValidEmail('user@example.com')).toBe(true);
});

test('valid phone', () => {
  expect(isValidPhone('1234567890')).toBe(true);
});

test('valid url', () => {
  expect(isValidUrl('https://example.com')).toBe(true);
});

// Missing tests:
// - null / undefined inputs
// - Empty strings
// - Invalid emails (no @, no domain, spaces, multiple @)
// - International phone formats
// - Edge case URLs (no protocol, just domain, IP addresses)
// - isValidAge (not tested at all)
// - isValidUsername (not tested at all)
// - Boundary values (age: -1, 0, 150, 151)
// - Type coercion (passing numbers where strings expected)
// - SQL injection / XSS in inputs
// - Unicode / special characters
