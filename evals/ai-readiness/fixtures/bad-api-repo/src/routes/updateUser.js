'use strict';

/**
 * PUT /updateUser/:id — REST violations:
 * - Verb in URL (should be PUT /users/:id or PATCH /users/:id)
 * - Accepts PUT but does partial update (PUT should replace the entire resource)
 * - Should use PATCH for partial updates
 * - Inconsistent status codes
 */

const users = new Map([
  [1, { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' }],
  [2, { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' }],
]);

function handler(req, res) {
  const id = parseInt(req.params.id, 10);
  const user = users.get(id);

  if (!user) {
    // Inconsistent: sometimes returns {error: ...}, sometimes {message: ...}
    return res.status(404).json({ message: 'Not found' });
  }

  // PUT is used but only partial fields are updated (should be PATCH)
  // PUT semantics require full resource replacement
  const updates = req.body;
  if (updates.name) user.name = updates.name;
  if (updates.email) user.email = updates.email;
  if (updates.role) user.role = updates.role;

  // Returns 200 — acceptable, but inconsistent with createUser which also returns 200
  // (createUser should be 201, this should be 200)
  res.status(200).json({
    ok: true, // Yet another success indicator format: 'ok', 'success', etc.
    data: user,
  });
}

module.exports = { handler };
