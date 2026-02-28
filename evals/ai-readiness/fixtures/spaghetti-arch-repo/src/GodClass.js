'use strict';

/**
 * GodClass.js — Architecture anti-pattern: God Object
 *
 * This class handles EVERYTHING:
 * - Database queries
 * - Input validation
 * - Data formatting
 * - Email sending
 * - File operations
 * - Caching
 * - Report generation
 * - Authentication
 *
 * It should be decomposed into focused services.
 */

class AppManager {
  constructor() {
    this.db = {};
    this.cache = {};
    this.emailQueue = [];
    this.files = {};
    this.sessions = {};
    this.config = {};
    this.logs = [];
  }

  // ========== DATABASE OPERATIONS ==========

  dbConnect(host, port, database) {
    this.db = { host, port, database, connected: true };
    this.log('Connected to database: ' + database);
  }

  dbQuery(sql, params) {
    this.log('SQL: ' + sql);
    if (!this.db.connected) throw new Error('Not connected');
    return [];
  }

  dbInsert(table, data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map(v => `'${v}'`).join(', ');
    return this.dbQuery(`INSERT INTO ${table} (${columns}) VALUES (${values})`);
  }

  dbUpdate(table, id, data) {
    const sets = Object.entries(data).map(([k, v]) => `${k} = '${v}'`).join(', ');
    return this.dbQuery(`UPDATE ${table} SET ${sets} WHERE id = ${id}`);
  }

  dbDelete(table, id) {
    return this.dbQuery(`DELETE FROM ${table} WHERE id = ${id}`);
  }

  dbFindById(table, id) {
    return this.dbQuery(`SELECT * FROM ${table} WHERE id = ${id}`);
  }

  dbFindAll(table, conditions) {
    let sql = `SELECT * FROM ${table}`;
    if (conditions) {
      const where = Object.entries(conditions).map(([k, v]) => `${k} = '${v}'`).join(' AND ');
      sql += ` WHERE ${where}`;
    }
    return this.dbQuery(sql);
  }

  dbCount(table) {
    return this.dbQuery(`SELECT COUNT(*) FROM ${table}`);
  }

  dbTransaction(operations) {
    this.dbQuery('BEGIN');
    try {
      for (const op of operations) {
        op();
      }
      this.dbQuery('COMMIT');
    } catch (e) {
      this.dbQuery('ROLLBACK');
      throw e;
    }
  }

  // ========== VALIDATION ==========

  validateEmail(email) {
    if (!email) return { valid: false, error: 'Email required' };
    if (typeof email !== 'string') return { valid: false, error: 'Email must be string' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: 'Invalid format' };
    return { valid: true };
  }

  validatePassword(password) {
    if (!password) return { valid: false, error: 'Password required' };
    if (password.length < 8) return { valid: false, error: 'Too short' };
    if (!/[A-Z]/.test(password)) return { valid: false, error: 'Needs uppercase' };
    if (!/[a-z]/.test(password)) return { valid: false, error: 'Needs lowercase' };
    if (!/[0-9]/.test(password)) return { valid: false, error: 'Needs number' };
    return { valid: true };
  }

  validateUsername(username) {
    if (!username) return { valid: false, error: 'Username required' };
    if (username.length < 3) return { valid: false, error: 'Too short' };
    if (username.length > 20) return { valid: false, error: 'Too long' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, error: 'Invalid characters' };
    return { valid: true };
  }

  validateAge(age) {
    if (typeof age !== 'number') return { valid: false, error: 'Must be number' };
    if (age < 0 || age > 150) return { valid: false, error: 'Out of range' };
    return { valid: true };
  }

  validatePhone(phone) {
    if (!phone) return { valid: false, error: 'Phone required' };
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleaned)) return { valid: false, error: 'Invalid format' };
    return { valid: true };
  }

  validateAddress(address) {
    if (!address) return { valid: false, error: 'Address required' };
    if (!address.street) return { valid: false, error: 'Street required' };
    if (!address.city) return { valid: false, error: 'City required' };
    if (!address.zip) return { valid: false, error: 'Zip required' };
    return { valid: true };
  }

  validateCreditCard(number) {
    if (!number) return { valid: false, error: 'Card number required' };
    const cleaned = number.replace(/[\s\-]/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return { valid: false, error: 'Invalid format' };
    return { valid: true };
  }

  // ========== FORMATTING ==========

  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatDateTime(date) {
    return `${this.formatDate(date)} ${new Date(date).toTimeString().slice(0, 8)}`;
  }

  formatCurrency(amount, currency) {
    const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  }

  formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  formatName(first, last) {
    return `${first.charAt(0).toUpperCase()}${first.slice(1)} ${last.charAt(0).toUpperCase()}${last.slice(1)}`;
  }

  formatAddress(address) {
    return `${address.street}\n${address.city}, ${address.state} ${address.zip}`;
  }

  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  }

  formatPercentage(value, total) {
    return `${((value / total) * 100).toFixed(1)}%`;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // ========== EMAIL OPERATIONS ==========

  sendEmail(to, subject, body) {
    this.emailQueue.push({ to, subject, body, sentAt: null });
    this.log(`Email queued: ${subject} -> ${to}`);
  }

  sendWelcomeEmail(user) {
    this.sendEmail(user.email, 'Welcome!', `Hi ${user.name}, welcome aboard!`);
  }

  sendPasswordResetEmail(user, token) {
    this.sendEmail(user.email, 'Password Reset', `Reset link: /reset?token=${token}`);
  }

  sendOrderConfirmation(user, order) {
    const total = this.formatCurrency(order.total, order.currency);
    this.sendEmail(user.email, `Order #${order.id} Confirmed`, `Total: ${total}`);
  }

  sendInvoice(user, invoice) {
    this.sendEmail(user.email, `Invoice #${invoice.id}`, this.generateInvoiceHtml(invoice));
  }

  processEmailQueue() {
    while (this.emailQueue.length > 0) {
      const email = this.emailQueue.shift();
      email.sentAt = new Date();
      this.log(`Email sent: ${email.subject}`);
    }
  }

  generateInvoiceHtml(invoice) {
    let html = `<h1>Invoice #${invoice.id}</h1>`;
    html += `<p>Date: ${this.formatDate(invoice.date)}</p>`;
    html += '<table><tr><th>Item</th><th>Qty</th><th>Price</th></tr>';
    for (const item of invoice.items || []) {
      html += `<tr><td>${item.name}</td><td>${item.qty}</td><td>${this.formatCurrency(item.price, 'USD')}</td></tr>`;
    }
    html += '</table>';
    html += `<p>Total: ${this.formatCurrency(invoice.total, 'USD')}</p>`;
    return html;
  }

  // ========== FILE OPERATIONS ==========

  readFile(path) {
    this.log('Reading file: ' + path);
    return this.files[path] || null;
  }

  writeFile(path, content) {
    this.log('Writing file: ' + path);
    this.files[path] = content;
  }

  deleteFile(path) {
    this.log('Deleting file: ' + path);
    delete this.files[path];
  }

  listFiles(directory) {
    return Object.keys(this.files).filter(f => f.startsWith(directory));
  }

  uploadFile(path, content, metadata) {
    this.writeFile(path, content);
    this.dbInsert('file_metadata', { path, ...metadata });
  }

  // ========== CACHE OPERATIONS ==========

  cacheGet(key) {
    const entry = this.cache[key];
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      delete this.cache[key];
      return null;
    }
    return entry.value;
  }

  cacheSet(key, value, ttlMs) {
    this.cache[key] = {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };
  }

  cacheDelete(key) {
    delete this.cache[key];
  }

  cacheClear() {
    this.cache = {};
  }

  // ========== AUTHENTICATION ==========

  createSession(userId) {
    const token = Math.random().toString(36).substring(2);
    this.sessions[token] = { userId, createdAt: Date.now() };
    return token;
  }

  validateSession(token) {
    const session = this.sessions[token];
    if (!session) return null;
    if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
      delete this.sessions[token];
      return null;
    }
    return session;
  }

  destroySession(token) {
    delete this.sessions[token];
  }

  // ========== REPORT GENERATION ==========

  generateUserReport(userId) {
    const user = this.dbFindById('users', userId);
    const orders = this.dbFindAll('orders', { userId });
    const total = orders.reduce((sum, o) => sum + o.total, 0);

    return {
      user,
      orderCount: orders.length,
      totalSpent: this.formatCurrency(total, 'USD'),
      memberSince: this.formatDate(user.createdAt),
      report: `User Report for ${user.name}: ${orders.length} orders, ${this.formatCurrency(total, 'USD')} spent`,
    };
  }

  generateSalesReport(startDate, endDate) {
    const orders = this.dbFindAll('orders');
    const filtered = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });

    const total = filtered.reduce((sum, o) => sum + o.total, 0);
    const avg = filtered.length > 0 ? total / filtered.length : 0;

    return {
      period: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
      orderCount: filtered.length,
      totalRevenue: this.formatCurrency(total, 'USD'),
      averageOrder: this.formatCurrency(avg, 'USD'),
    };
  }

  generateInventoryReport() {
    const items = this.dbFindAll('inventory');
    const lowStock = items.filter(i => i.quantity < 10);
    const outOfStock = items.filter(i => i.quantity === 0);

    return {
      totalItems: items.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      items: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        status: i.quantity === 0 ? 'OUT' : i.quantity < 10 ? 'LOW' : 'OK',
      })),
    };
  }

  // ========== LOGGING ==========

  log(message) {
    const entry = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(entry);
    console.log(entry);
  }

  getLogs(count) {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
  }

  // ========== CONFIGURATION ==========

  setConfig(key, value) {
    this.config[key] = value;
  }

  getConfig(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }
}

module.exports = AppManager;
