'use strict';

/**
 * moduleA.js — Circular dependency with moduleB.
 * moduleA imports moduleB, and moduleB imports moduleA.
 */

const moduleB = require('./moduleB');

function processOrder(order) {
  const validated = validateOrder(order);
  if (!validated.valid) {
    throw new Error(validated.error);
  }
  // Uses moduleB to calculate totals
  const total = moduleB.calculateOrderTotal(order);
  return { ...order, total, status: 'processed' };
}

function validateOrder(order) {
  if (!order) return { valid: false, error: 'Order required' };
  if (!order.items || order.items.length === 0) {
    return { valid: false, error: 'Order must have items' };
  }
  // Uses moduleB for item validation (circular!)
  for (const item of order.items) {
    if (!moduleB.isValidItem(item)) {
      return { valid: false, error: `Invalid item: ${item.id}` };
    }
  }
  return { valid: true };
}

function getOrderSummary(orderId) {
  // Depends on moduleB for formatting
  return moduleB.formatOrderSummary(orderId);
}

module.exports = { processOrder, validateOrder, getOrderSummary };
