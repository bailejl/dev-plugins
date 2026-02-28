'use strict';

/**
 * moduleB.js — Circular dependency with moduleA.
 * moduleB imports moduleA, and moduleA imports moduleB.
 */

const moduleA = require('./moduleA');

function calculateOrderTotal(order) {
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  // Apply discount if order is valid (circular call back to moduleA!)
  if (total > 100) {
    const validated = moduleA.validateOrder(order);
    if (validated.valid) {
      total *= 0.9; // 10% discount
    }
  }
  return total;
}

function isValidItem(item) {
  if (!item) return false;
  if (!item.id || !item.price || !item.quantity) return false;
  if (item.price < 0 || item.quantity < 0) return false;
  return true;
}

function formatOrderSummary(orderId) {
  // This calls back into moduleA (circular)
  return {
    orderId,
    formatted: true,
    timestamp: new Date().toISOString(),
  };
}

function getDiscountedOrders(orders) {
  // Processes through moduleA (circular)
  return orders
    .filter(o => moduleA.validateOrder(o).valid)
    .map(o => moduleA.processOrder(o));
}

module.exports = { calculateOrderTotal, isValidItem, formatOrderSummary, getDiscountedOrders };
