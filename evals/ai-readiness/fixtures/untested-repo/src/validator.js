'use strict';

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/[\s\-\(\)\.]/g, '');
  return /^\+?\d{10,15}$/.test(digits);
}

function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidAge(age) {
  if (typeof age !== 'number') return false;
  return Number.isInteger(age) && age >= 0 && age <= 150;
}

function isValidUsername(username) {
  if (typeof username !== 'string') return false;
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

module.exports = { isValidEmail, isValidPhone, isValidUrl, isValidAge, isValidUsername };
