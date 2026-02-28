# CLAUDE.md

## Project Overview

This is a Node.js user management service. It uses an in-memory store for simplicity but is designed to be swapped for a real database.

## Conventions

- Use camelCase for variables and functions
- Use JSDoc for all exported functions
- Tests go in `tests/` directory, named `*.test.js`
- Error handling: throw typed errors, catch at boundaries
- No external dependencies beyond Node.js built-ins

## Testing

Run tests with `npm test`. Tests use Node.js built-in `assert` module.
All new functionality must have corresponding tests including edge cases.

## Code Style

- 2-space indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters
