# User Service

A lightweight Node.js user management service with clean architecture and comprehensive testing.

## Getting Started

```bash
npm install
npm start
```

## Development

```bash
npm test          # Run tests
npm run lint      # Run linter
npm run format    # Format code
```

## Project Structure

```
src/
  index.js            # Application entry point
  utils.js            # Shared utility functions
  user-service.js     # User business logic
tests/
  user-service.test.js  # User service tests
```

## API

The user service exposes the following methods:

- `createUser(name, email)` — Create a new user
- `getUserById(id)` — Retrieve a user by ID
- `updateUser(id, updates)` — Update user fields
- `deleteUser(id)` — Soft-delete a user
- `listUsers(options)` — List users with pagination

## License

MIT
