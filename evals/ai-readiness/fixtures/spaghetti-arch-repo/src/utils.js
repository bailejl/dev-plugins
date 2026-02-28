'use strict';

/**
 * utils.js — Architecture anti-pattern: Utility dumping ground.
 *
 * This file contains completely unrelated functions mixed together:
 * - String manipulation
 * - Math operations
 * - Date formatting
 * - Array helpers
 * - HTTP helpers
 * - Color conversion
 * - Crypto operations
 *
 * These should be organized into focused modules by domain.
 */

// --- String utils ---
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// --- Math utils ---
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundTo(num, decimals) {
  return Number(num.toFixed(decimals));
}

function average(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// --- Date utils ---
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatRelative(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// --- Array utils ---
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function unique(arr) {
  return [...new Set(arr)];
}

function flatten(arr) {
  return arr.reduce((flat, item) =>
    flat.concat(Array.isArray(item) ? flatten(item) : item), []);
}

function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const val = item[key];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
}

// --- HTTP utils ---
function parseQueryString(qs) {
  return Object.fromEntries(new URLSearchParams(qs));
}

function buildQueryString(params) {
  return new URLSearchParams(params).toString();
}

function isUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

// --- Color utils (why is this here?) ---
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// --- Crypto utils (security-sensitive, shouldn't be in generic utils) ---
function hashString(str) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateToken(length) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  capitalize, slugify, truncate, camelToSnake, snakeToCamel,
  clamp, randomInt, roundTo, average, median,
  daysAgo, isWeekend, formatRelative,
  chunk, unique, flatten, groupBy,
  parseQueryString, buildQueryString, isUrl,
  hexToRgb, rgbToHex,
  hashString, generateToken,
};
