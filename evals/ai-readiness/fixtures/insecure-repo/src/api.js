'use strict';

/**
 * API routes — multiple security issues:
 * - Missing auth middleware on admin routes
 * - CORS set to wildcard
 * - Verbose error messages exposing stack traces
 */

// CORS configuration — allows all origins
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: true, // Dangerous with origin: '*'
};

function setupRoutes(app) {
  // Public routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/login', (req, res) => {
    // Login handler
    res.json({ token: 'xxx' });
  });

  // Admin routes — NO AUTH MIDDLEWARE
  // These should require authentication and admin role
  app.get('/api/admin/users', (req, res) => {
    res.json({ users: [] });
  });

  app.delete('/api/admin/users/:id', (req, res) => {
    res.json({ deleted: true });
  });

  app.post('/api/admin/reset-database', (req, res) => {
    // Extremely dangerous endpoint with no auth
    res.json({ reset: true });
  });

  app.get('/api/admin/config', (req, res) => {
    // Exposes internal configuration
    res.json({
      dbHost: process.env.DATABASE_URL,
      apiKey: process.env.API_KEY,
      env: process.env.NODE_ENV,
      version: process.version,
    });
  });

  // Error handler that leaks stack traces
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      error: err.message,
      stack: err.stack, // Never expose stack traces in production!
      code: err.code,
      details: {
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body, // Echoing back request body is dangerous
        headers: req.headers, // Exposing all headers including auth
      },
    });
  });
}

module.exports = { setupRoutes, corsOptions };
