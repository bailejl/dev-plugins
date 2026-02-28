'use strict';

const crypto = require('crypto');

// Hardcoded JWT secret — should be in environment variable
const JWT_SECRET = 'my-super-secret-jwt-key-do-not-share';
const TOKEN_EXPIRY = '7d';

/**
 * Hash a password using MD5.
 * NOTE: MD5 is fast and unsuitable for password hashing.
 * Should use bcrypt, scrypt, or argon2.
 */
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

/**
 * Generate a JWT token (simplified simulation).
 * Uses hardcoded secret instead of env var.
 */
function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })).toString('base64');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64');

  return `${header}.${payload}.${signature}`;
}

/**
 * Login handler — no rate limiting, no account lockout.
 */
function login(email, password, users) {
  const user = users.find(u => u.email === email);
  if (!user) {
    return { error: 'Invalid credentials' };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    // No failed attempt tracking or rate limiting
    return { error: 'Invalid credentials' };
  }

  const token = generateToken(user);
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

module.exports = { hashPassword, verifyPassword, generateToken, login, JWT_SECRET };
