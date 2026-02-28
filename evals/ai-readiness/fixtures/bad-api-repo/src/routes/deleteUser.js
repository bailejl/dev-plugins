'use strict';

/**
 * DELETE /deleteUser/:id — REST violations:
 * - Verb in URL (should be DELETE /users/:id)
 * - Returns {success: true} body instead of 204 No Content
 * - Not idempotent — returns 404 on second call
 */

const deletedIds = new Set();

function handler(req, res) {
  const id = parseInt(req.params.id, 10);

  // Not idempotent: DELETE should succeed even if already deleted
  if (deletedIds.has(id)) {
    return res.status(404).json({ error: 'User already deleted' });
  }

  if (isNaN(id)) {
    return res.status(400).json({ error_message: 'Invalid ID' }); // Yet another error key
  }

  deletedIds.add(id);

  // Should return 204 No Content with no body
  res.status(200).json({
    success: true,
    message: `User ${id} deleted`,
    deletedAt: new Date().toISOString(),
  });
}

module.exports = { handler };
