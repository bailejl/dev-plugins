'use strict';

const { add, subtract, multiply } = require('../src/calculator');

// Tautological tests, generic names, no edge cases

test('test1', () => {
  expect(true).toBe(true);
});

test('test2', () => {
  const result = add(1, 2);
  expect(result).toBeTruthy();
});

test('test3', () => {
  expect(true).toBe(true);
  expect(1).toBe(1);
});

test('addition works', () => {
  // Tests the mock, not the actual function
  const mockAdd = jest.fn().mockReturnValue(5);
  expect(mockAdd(2, 3)).toBe(5);
  expect(mockAdd).toHaveBeenCalledWith(2, 3);
});

test('subtraction', () => {
  // Only tests one case
  expect(subtract(5, 3)).toBe(2);
});

test('multiply', () => {
  // Only positive integers, no edge cases
  expect(multiply(2, 3)).toBe(6);
});

test('calculator test', () => {
  // Vague test name, tests multiple things poorly
  expect(add(1, 1)).toBe(2);
  expect(typeof add).toBe('function');
});

// No tests for:
// - divide (especially division by zero)
// - factorial (negative numbers, zero, large numbers)
// - power
// - percentage
// - Negative numbers
// - Floating point edge cases
// - Type coercion issues
// - Very large numbers / overflow
