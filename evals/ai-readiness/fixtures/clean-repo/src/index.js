'use strict';

const { UserService } = require('./user-service');
const { formatTimestamp } = require('./utils');

/**
 * Application entry point.
 * Initializes the user service and runs a demo workflow.
 */
async function main() {
  const service = new UserService();

  const user = await service.createUser('Alice', 'alice@example.com');
  console.log(`Created user: ${user.name} (${user.id}) at ${formatTimestamp(user.createdAt)}`);

  const fetched = await service.getUserById(user.id);
  console.log(`Fetched user: ${fetched.name}`);

  const updated = await service.updateUser(user.id, { name: 'Alice Smith' });
  console.log(`Updated user: ${updated.name}`);

  const users = await service.listUsers({ limit: 10, offset: 0 });
  console.log(`Total users: ${users.total}`);

  await service.deleteUser(user.id);
  console.log('User soft-deleted');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
