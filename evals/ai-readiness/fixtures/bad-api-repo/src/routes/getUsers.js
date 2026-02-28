'use strict';

/**
 * GET /getUsers — REST violation: verb in URL.
 * Should be: GET /users
 *
 * Also missing pagination.
 */

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
];

function handler(req, res) {
  // No pagination — returns all users regardless of dataset size
  // Should support ?page=1&limit=20 or ?offset=0&limit=20
  res.status(200).json({
    data: users,
    // No total count, no next/prev links
  });
}

// Error format differs from other endpoints
function errorHandler(err, req, res, next) {
  res.status(500).json({ msg: err.message }); // 'msg' instead of 'error'
}

module.exports = { handler, errorHandler };
