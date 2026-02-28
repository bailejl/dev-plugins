'use strict';

/**
 * controller.js — Architecture anti-pattern: Layer violations.
 *
 * This controller:
 * - Directly queries the database (skipping service/repository layers)
 * - Contains business logic inline (should be in services)
 * - Mixes concerns: validation, data access, transformation, response
 */

function handleGetUser(req, res) {
  // Direct database query in controller (should go through service → repository)
  const userId = req.params.id;
  const sql = `SELECT * FROM users WHERE id = ${userId}`;
  const user = fakeDbQuery(sql);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Business logic inline in controller
  // This should be in a UserService
  const isActive = user.lastLogin &&
    (Date.now() - new Date(user.lastLogin).getTime()) < 30 * 24 * 60 * 60 * 1000;

  const membershipLevel = calculateMembershipLevel(user);

  // Data transformation inline
  // This should be in a presenter/serializer
  const response = {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    isActive,
    membershipLevel,
    joinedAgo: formatTimeAgo(user.createdAt),
    orderCount: getOrderCount(userId), // Another direct DB query
  };

  res.json(response);
}

function handleCreateUser(req, res) {
  // Validation inline (should be middleware or validation service)
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || firstName.length < 2) {
    return res.status(400).json({ error: 'First name too short' });
  }
  if (!lastName) {
    return res.status(400).json({ error: 'Last name required' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }

  // Direct DB query to check for duplicates
  const existing = fakeDbQuery(`SELECT id FROM users WHERE email = '${email}'`);
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  // Password hashing inline (should be in auth service)
  const hashedPassword = require('crypto').createHash('sha256').update(password).digest('hex');

  // Direct DB insert
  const newUser = fakeDbQuery(
    `INSERT INTO users (firstName, lastName, email, password, createdAt) VALUES ('${firstName}', '${lastName}', '${email}', '${hashedPassword}', NOW()) RETURNING *`
  );

  // Send welcome email inline (should be event-driven or in a service)
  console.log(`Sending welcome email to ${email}...`);

  res.status(201).json({ id: newUser.id, name: `${firstName} ${lastName}`, email });
}

function handleListOrders(req, res) {
  const userId = req.params.userId;

  // Complex business logic in controller
  const orders = fakeDbQuery(`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC`);
  const enriched = orders.map(order => {
    const items = fakeDbQuery(`SELECT * FROM order_items WHERE order_id = ${order.id}`);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;

    return {
      ...order,
      items,
      subtotal,
      tax,
      shipping,
      total,
      formattedTotal: `$${total.toFixed(2)}`,
      status: getOrderStatus(order),
    };
  });

  // Pagination logic inline
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;

  res.json({
    orders: enriched.slice(start, start + limit),
    total: enriched.length,
    page,
    pages: Math.ceil(enriched.length / limit),
  });
}

// Helper functions that should be in separate modules
function calculateMembershipLevel(user) {
  const orderCount = getOrderCount(user.id);
  if (orderCount > 100) return 'platinum';
  if (orderCount > 50) return 'gold';
  if (orderCount > 10) return 'silver';
  return 'bronze';
}

function getOrderCount(userId) {
  return fakeDbQuery(`SELECT COUNT(*) as count FROM orders WHERE user_id = ${userId}`).count || 0;
}

function getOrderStatus(order) {
  if (order.cancelledAt) return 'cancelled';
  if (order.deliveredAt) return 'delivered';
  if (order.shippedAt) return 'shipped';
  if (order.paidAt) return 'paid';
  return 'pending';
}

function formatTimeAgo(date) {
  const ms = Date.now() - new Date(date).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days > 365) return `${Math.floor(days / 365)} years ago`;
  if (days > 30) return `${Math.floor(days / 30)} months ago`;
  if (days > 0) return `${days} days ago`;
  return 'today';
}

function fakeDbQuery(sql) {
  console.log('SQL:', sql);
  return {};
}

module.exports = { handleGetUser, handleCreateUser, handleListOrders };
