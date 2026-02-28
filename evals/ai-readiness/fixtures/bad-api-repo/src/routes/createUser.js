'use strict';

/**
 * POST /createUser — REST violation: verb in URL.
 * Should be: POST /users
 *
 * Returns 200 instead of 201 Created.
 * Inconsistent error format.
 */

function handler(req, res) {
  const { name, email } = req.body;

  if (!name) {
    // Inconsistent error format (different from getUsers error format)
    return res.status(400).json({ success: false, reason: 'Name is required' });
  }

  if (!email) {
    // Yet another error format
    return res.status(400).json({ error: true, field: 'email', message: 'Email is required' });
  }

  const newUser = {
    id: Math.floor(Math.random() * 10000),
    name,
    email,
    createdAt: new Date().toISOString(),
  };

  // Should return 201 Created, not 200 OK
  // Should include Location header
  res.status(200).json({
    success: true,
    user: newUser,
  });
}

module.exports = { handler };
