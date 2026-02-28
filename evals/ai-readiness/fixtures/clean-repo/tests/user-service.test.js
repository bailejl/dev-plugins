'use strict';

const assert = require('assert');
const { UserService, UserNotFoundError, ValidationError } = require('../src/user-service');

describe('UserService', () => {
  let service;

  beforeEach(() => {
    service = new UserService();
  });

  describe('createUser', () => {
    it('should create a user with valid name and email', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      assert.strictEqual(user.name, 'Alice');
      assert.strictEqual(user.email, 'alice@example.com');
      assert.ok(user.id);
      assert.ok(user.createdAt instanceof Date);
      assert.strictEqual(user.deleted, false);
    });

    it('should trim whitespace from name and email', async () => {
      const user = await service.createUser('  Bob  ', '  BOB@Example.COM  ');
      assert.strictEqual(user.name, 'Bob');
      assert.strictEqual(user.email, 'bob@example.com');
    });

    it('should throw ValidationError for empty name', async () => {
      await assert.rejects(
        () => service.createUser('', 'test@example.com'),
        (err) => err instanceof ValidationError
      );
    });

    it('should throw ValidationError for null name', async () => {
      await assert.rejects(
        () => service.createUser(null, 'test@example.com'),
        (err) => err instanceof ValidationError
      );
    });

    it('should throw ValidationError for invalid email', async () => {
      await assert.rejects(
        () => service.createUser('Alice', 'not-an-email'),
        (err) => err instanceof ValidationError
      );
    });

    it('should throw ValidationError for empty email', async () => {
      await assert.rejects(
        () => service.createUser('Alice', ''),
        (err) => err instanceof ValidationError
      );
    });
  });

  describe('getUserById', () => {
    it('should retrieve an existing user', async () => {
      const created = await service.createUser('Alice', 'alice@example.com');
      const fetched = await service.getUserById(created.id);
      assert.strictEqual(fetched.name, 'Alice');
      assert.strictEqual(fetched.email, 'alice@example.com');
    });

    it('should throw UserNotFoundError for nonexistent ID', async () => {
      await assert.rejects(
        () => service.getUserById('nonexistent-id'),
        (err) => err instanceof UserNotFoundError
      );
    });

    it('should throw UserNotFoundError for deleted user', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      await service.deleteUser(user.id);
      await assert.rejects(
        () => service.getUserById(user.id),
        (err) => err instanceof UserNotFoundError
      );
    });

    it('should return a copy, not a reference to internal state', async () => {
      const created = await service.createUser('Alice', 'alice@example.com');
      const fetched = await service.getUserById(created.id);
      fetched.name = 'MODIFIED';
      const refetched = await service.getUserById(created.id);
      assert.strictEqual(refetched.name, 'Alice');
    });
  });

  describe('updateUser', () => {
    it('should update user name', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      const updated = await service.updateUser(user.id, { name: 'Alice Smith' });
      assert.strictEqual(updated.name, 'Alice Smith');
      assert.strictEqual(updated.email, 'alice@example.com');
    });

    it('should update user email', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      const updated = await service.updateUser(user.id, { email: 'alice.smith@example.com' });
      assert.strictEqual(updated.email, 'alice.smith@example.com');
    });

    it('should update the updatedAt timestamp', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      const originalUpdatedAt = user.updatedAt;
      const updated = await service.updateUser(user.id, { name: 'Alice Smith' });
      assert.ok(updated.updatedAt >= originalUpdatedAt);
    });

    it('should throw UserNotFoundError for nonexistent user', async () => {
      await assert.rejects(
        () => service.updateUser('nonexistent', { name: 'Test' }),
        (err) => err instanceof UserNotFoundError
      );
    });

    it('should throw ValidationError for invalid email update', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      await assert.rejects(
        () => service.updateUser(user.id, { email: 'bad-email' }),
        (err) => err instanceof ValidationError
      );
    });

    it('should throw ValidationError for empty name update', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      await assert.rejects(
        () => service.updateUser(user.id, { name: '' }),
        (err) => err instanceof ValidationError
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft-delete an existing user', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      await service.deleteUser(user.id);
      await assert.rejects(
        () => service.getUserById(user.id),
        (err) => err instanceof UserNotFoundError
      );
    });

    it('should throw UserNotFoundError for nonexistent user', async () => {
      await assert.rejects(
        () => service.deleteUser('nonexistent'),
        (err) => err instanceof UserNotFoundError
      );
    });

    it('should throw UserNotFoundError for already-deleted user', async () => {
      const user = await service.createUser('Alice', 'alice@example.com');
      await service.deleteUser(user.id);
      await assert.rejects(
        () => service.deleteUser(user.id),
        (err) => err instanceof UserNotFoundError
      );
    });
  });

  describe('listUsers', () => {
    it('should return empty list when no users exist', async () => {
      const result = await service.listUsers();
      assert.strictEqual(result.users.length, 0);
      assert.strictEqual(result.total, 0);
    });

    it('should return all active users', async () => {
      await service.createUser('Alice', 'alice@example.com');
      await service.createUser('Bob', 'bob@example.com');
      const result = await service.listUsers();
      assert.strictEqual(result.users.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it('should exclude deleted users', async () => {
      const alice = await service.createUser('Alice', 'alice@example.com');
      await service.createUser('Bob', 'bob@example.com');
      await service.deleteUser(alice.id);
      const result = await service.listUsers();
      assert.strictEqual(result.users.length, 1);
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.users[0].name, 'Bob');
    });

    it('should respect limit parameter', async () => {
      await service.createUser('Alice', 'alice@example.com');
      await service.createUser('Bob', 'bob@example.com');
      await service.createUser('Charlie', 'charlie@example.com');
      const result = await service.listUsers({ limit: 2 });
      assert.strictEqual(result.users.length, 2);
      assert.strictEqual(result.total, 3);
    });

    it('should respect offset parameter', async () => {
      await service.createUser('Alice', 'alice@example.com');
      await service.createUser('Bob', 'bob@example.com');
      await service.createUser('Charlie', 'charlie@example.com');
      const result = await service.listUsers({ offset: 1, limit: 10 });
      assert.strictEqual(result.users.length, 2);
    });

    it('should use default pagination when no options given', async () => {
      const result = await service.listUsers();
      assert.ok(Array.isArray(result.users));
      assert.strictEqual(typeof result.total, 'number');
    });
  });
});

/**
 * Simple test runner (no external deps).
 */
const suites = [];
function describe(name, fn) {
  const suite = { name, tests: [] };
  suites.push(suite);
  const outer = global._currentSuite;
  global._currentSuite = suite;
  fn();
  global._currentSuite = outer;
}

function it(name, fn) {
  global._currentSuite.tests.push({ name, fn });
}

function beforeEach(fn) {
  global._currentSuite.beforeEach = fn;
}

// Re-run to register
delete require.cache[__filename];
