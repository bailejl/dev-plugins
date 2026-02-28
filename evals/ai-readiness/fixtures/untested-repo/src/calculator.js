'use strict';

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

function factorial(n) {
  if (n < 0) throw new Error('Negative factorial');
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function power(base, exponent) {
  return Math.pow(base, exponent);
}

function percentage(value, total) {
  if (total === 0) throw new Error('Total cannot be zero');
  return (value / total) * 100;
}

module.exports = { add, subtract, multiply, divide, factorial, power, percentage };
