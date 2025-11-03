/**
 * validation.test.js
 * Unit Tests for Validation Utilities
 * Tests validation functions for ticket counts and input sanitization
 */
const { validateTicketCount, validateEventId, sanitizeInput } = require('../../utils/validation');

describe('Validation Unit Tests', () => {
  describe('validateTicketCount', () => {
    test('should accept valid ticket counts', () => {
      expect(validateTicketCount(1)).toBe(true);
      expect(validateTicketCount(5)).toBe(true);
    });

    test('should reject invalid ticket counts', () => {
      expect(validateTicketCount(0)).toBe(false);
      expect(validateTicketCount(-1)).toBe(false);
      expect(validateTicketCount('abc')).toBe(false);
    });
  });

 describe('sanitizeInput', () => {
  test('should remove script tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>');
  });

  test('should remove HTML tags', () => {
    expect(sanitizeInput('<div>test</div>')).toBe('test');
  });

  test('should handle non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('');
  });
});
});