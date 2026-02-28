'use strict';

const crypto = require('crypto');

/**
 * Generate a random UUID v4.
 *
 * @returns {string} A UUID string
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Format a Date object into a human-readable timestamp.
 *
 * @param {Date} date - The date to format
 * @returns {string} Formatted timestamp (e.g., "2025-01-15 14:30:00")
 */
function formatTimestamp(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new TypeError('Expected a valid Date object');
  }
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Validate an email address format.
 *
 * @param {string} email - The email to validate
 * @returns {boolean} True if the email format is valid
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize a string for safe display by escaping HTML entities.
 *
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string
 */
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = { generateId, formatTimestamp, isValidEmail, sanitize };
