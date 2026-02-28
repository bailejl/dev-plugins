'use strict';

const { generateId, isValidEmail } = require('./utils');

/**
 * Custom error for user-not-found scenarios.
 */
class UserNotFoundError extends Error {
  constructor(id) {
    super(`User not found: ${id}`);
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

/**
 * Custom error for validation failures.
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * In-memory user management service.
 * Provides CRUD operations with validation and error handling.
 */
class UserService {
  constructor() {
    this.users = new Map();
  }

  /**
   * Create a new user.
   *
   * @param {string} name - User's display name
   * @param {string} email - User's email address
   * @returns {Promise<Object>} The created user object
   * @throws {ValidationError} If name or email is invalid
   */
  async createUser(name, email) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Name is required and must be a non-empty string');
    }
    if (!isValidEmail(email)) {
      throw new ValidationError('A valid email address is required');
    }

    const user = {
      id: generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
    };

    this.users.set(user.id, user);
    return { ...user };
  }

  /**
   * Retrieve a user by their ID.
   *
   * @param {string} id - The user's unique identifier
   * @returns {Promise<Object>} The user object
   * @throws {UserNotFoundError} If the user doesn't exist or is deleted
   */
  async getUserById(id) {
    const user = this.users.get(id);
    if (!user || user.deleted) {
      throw new UserNotFoundError(id);
    }
    return { ...user };
  }

  /**
   * Update a user's fields.
   *
   * @param {string} id - The user's unique identifier
   * @param {Object} updates - Fields to update (name, email)
   * @returns {Promise<Object>} The updated user object
   * @throws {UserNotFoundError} If the user doesn't exist
   * @throws {ValidationError} If the updates are invalid
   */
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user || user.deleted) {
      throw new UserNotFoundError(id);
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        throw new ValidationError('Name must be a non-empty string');
      }
      user.name = updates.name.trim();
    }

    if (updates.email !== undefined) {
      if (!isValidEmail(updates.email)) {
        throw new ValidationError('Invalid email format');
      }
      user.email = updates.email.toLowerCase().trim();
    }

    user.updatedAt = new Date();
    return { ...user };
  }

  /**
   * Soft-delete a user by marking them as deleted.
   *
   * @param {string} id - The user's unique identifier
   * @returns {Promise<void>}
   * @throws {UserNotFoundError} If the user doesn't exist
   */
  async deleteUser(id) {
    const user = this.users.get(id);
    if (!user || user.deleted) {
      throw new UserNotFoundError(id);
    }
    user.deleted = true;
    user.updatedAt = new Date();
  }

  /**
   * List users with pagination support.
   *
   * @param {Object} options - Pagination options
   * @param {number} [options.limit=20] - Maximum number of users to return
   * @param {number} [options.offset=0] - Number of users to skip
   * @returns {Promise<{ users: Object[], total: number }>}
   */
  async listUsers({ limit = 20, offset = 0 } = {}) {
    const activeUsers = [...this.users.values()].filter((u) => !u.deleted);
    const paginated = activeUsers.slice(offset, offset + limit);

    return {
      users: paginated.map((u) => ({ ...u })),
      total: activeUsers.length,
    };
  }
}

module.exports = { UserService, UserNotFoundError, ValidationError };
