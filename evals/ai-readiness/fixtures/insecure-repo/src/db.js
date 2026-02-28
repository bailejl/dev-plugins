'use strict';

/**
 * Database query module.
 * WARNING: Contains SQL injection vulnerabilities.
 */

// Simulated database connection
const db = {
  query: function(sql) {
    console.log('Executing SQL:', sql);
    return [];
  }
};

/**
 * Get a user by ID — SQL INJECTION via string concatenation.
 * Should use parameterized queries.
 */
function getUserById(req) {
  const sql = `SELECT * FROM users WHERE id = ${req.params.id}`;
  return db.query(sql);
}

/**
 * Search users — SQL INJECTION via string concatenation.
 */
function searchUsers(req) {
  const sql = `SELECT * FROM users WHERE name LIKE '%${req.query.search}%' ORDER BY ${req.query.sort || 'name'}`;
  return db.query(sql);
}

/**
 * Delete a user — SQL INJECTION.
 */
function deleteUser(req) {
  const sql = `DELETE FROM users WHERE id = ${req.params.id} AND org_id = ${req.params.orgId}`;
  return db.query(sql);
}

/**
 * Update user profile — SQL INJECTION via string interpolation.
 */
function updateUserProfile(req) {
  const { name, email, bio } = req.body;
  const sql = `UPDATE users SET name = '${name}', email = '${email}', bio = '${bio}' WHERE id = ${req.params.id}`;
  return db.query(sql);
}

/**
 * Raw query endpoint — executes arbitrary SQL.
 */
function rawQuery(req) {
  return db.query(req.body.sql);
}

module.exports = { getUserById, searchUsers, deleteUser, updateUserProfile, rawQuery };
