'use strict';

// God class: does everything — DB, validation, formatting, email, logging

class UserManager {
  constructor() {
    this.users = [];
    this.emailQueue = [];
    this.logBuffer = [];
  }

  // ---- Database operations ----

  getAll() {
    this.log('Getting all users');
    return this.users;
  }

  getById(id) {
    this.log('Getting user by id: ' + id);
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].id == id) {
        return this.users[i];
      }
    }
    return null;
  }

  save(user) {
    this.log('Saving user');
    if (this.validateUser(user)) {
      user.id = this.users.length + 1;
      user.createdAt = new Date();
      this.users.push(user);
      this.sendWelcomeEmail(user);
      this.formatAndLog(user);
      return user;
    }
    return null;
  }

  update(id, data) {
    this.log('Updating user: ' + id);
    var user = this.getById(id);
    if (user) {
      if (data.name) user.name = data.name;
      if (data.email) {
        if (this.validateEmail(data.email)) {
          user.email = data.email;
          this.sendEmailChangedNotification(user);
        }
      }
      if (data.role) user.role = data.role;
      if (data.status) user.status = data.status;
      user.updatedAt = new Date();
      this.formatAndLog(user);
      return user;
    }
    return null;
  }

  delete(id) {
    this.log('Deleting user: ' + id);
    var idx = -1;
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].id == id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      var user = this.users[idx];
      this.users.splice(idx, 1);
      this.sendGoodbyeEmail(user);
      return true;
    }
    return false;
  }

  // ---- Validation ----

  validateUser(user) {
    if (!user) return false;
    if (!user.name || user.name.length < 1) return false;
    if (!user.email) return false;
    if (!this.validateEmail(user.email)) return false;
    return true;
  }

  validateEmail(email) {
    // Simple check
    if (!email) return false;
    if (email.indexOf('@') < 0) return false;
    if (email.indexOf('.') < 0) return false;
    return true;
  }

  // ---- Formatting ----

  formatUser(user) {
    return {
      id: user.id,
      displayName: this.formatName(user.name),
      email: user.email.toLowerCase(),
      role: user.role || 'user',
      status: user.status || 'active',
      memberSince: this.formatDate(user.createdAt),
    };
  }

  formatName(name) {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  formatDate(date) {
    if (!date) return 'N/A';
    var d = new Date(date);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  formatAndLog(user) {
    var formatted = this.formatUser(user);
    this.log('User formatted: ' + JSON.stringify(formatted));
  }

  // ---- Email sending ----

  sendWelcomeEmail(user) {
    this.log('Sending welcome email to: ' + user.email);
    this.emailQueue.push({
      to: user.email,
      subject: 'Welcome!',
      body: 'Hello ' + user.name + ', welcome to our platform!',
      type: 'welcome',
    });
    this.processEmailQueue();
  }

  sendEmailChangedNotification(user) {
    this.log('Sending email change notification to: ' + user.email);
    this.emailQueue.push({
      to: user.email,
      subject: 'Email Updated',
      body: 'Your email has been updated to ' + user.email,
      type: 'notification',
    });
    this.processEmailQueue();
  }

  sendGoodbyeEmail(user) {
    this.log('Sending goodbye email to: ' + user.email);
    this.emailQueue.push({
      to: user.email,
      subject: 'Sorry to see you go',
      body: 'Your account has been deleted.',
      type: 'goodbye',
    });
    this.processEmailQueue();
  }

  processEmailQueue() {
    while (this.emailQueue.length > 0) {
      var email = this.emailQueue.shift();
      // Simulate sending
      this.log('EMAIL SENT: ' + email.subject + ' -> ' + email.to);
    }
  }

  // ---- Logging ----

  log(message) {
    var entry = '[' + new Date().toISOString() + '] ' + message;
    this.logBuffer.push(entry);
    console.log(entry);
  }

  getLogBuffer() {
    return this.logBuffer;
  }

  clearLogBuffer() {
    this.logBuffer = [];
  }

  // ---- Reporting ----

  getUserStats() {
    var stats = {
      total: this.users.length,
      active: 0,
      inactive: 0,
      admins: 0,
    };

    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].status === 'active') stats.active++;
      else stats.inactive++;
      if (this.users[i].role === 'admin') stats.admins++;
    }

    return stats;
  }

  exportUsers(format) {
    if (format === 'json') {
      return JSON.stringify(this.users.map(u => this.formatUser(u)));
    } else if (format === 'csv') {
      var csv = 'id,name,email,role,status\n';
      for (var i = 0; i < this.users.length; i++) {
        var u = this.users[i];
        csv += u.id + ',' + u.name + ',' + u.email + ',' +
          (u.role || 'user') + ',' + (u.status || 'active') + '\n';
      }
      return csv;
    }
    return null;
  }
}

module.exports = UserManager;
