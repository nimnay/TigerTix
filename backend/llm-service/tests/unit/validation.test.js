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
    test('should remove malicious characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>');
      expect(sanitizeInput("'; DROP TABLE users;--")).not.toContain('DROP');
    });
  });
});