const { parseBookingIntent, extractEventName, extractTicketCount } = require('../../services/llmParser');

describe('LLM Parser Unit Tests', () => {
  describe('extractTicketCount', () => {
    test('should extract ticket count from text', () => {
      expect(extractTicketCount('Book 2 tickets')).toBe(2);
      expect(extractTicketCount('I want 5 tickets')).toBe(5);
      expect(extractTicketCount('One ticket please')).toBe(1);
    });

    test('should return null for invalid input', () => {
      expect(extractTicketCount('No numbers here')).toBeNull();
      expect(extractTicketCount('')).toBeNull();
    });
  });

  describe('extractEventName', () => {
    test('should extract event name from booking request', () => {
      expect(extractEventName('Book tickets for Jazz Night')).toBe('jazz night');
      expect(extractEventName('2 tickets for AI Tech Expo')).toBe('ai tech expo');
    });

    test('should handle malformed input', () => {
      expect(extractEventName('just random text')).toBeNull();
    });
  });

  describe('parseBookingIntent', () => {
    test('should identify booking intent', () => {
      const result = parseBookingIntent('Book 2 tickets for Jazz Night');
      expect(result.intent).toBe('book');
      expect(result.tickets).toBe(2);
      expect(result.eventName).toBeDefined();
    });

    test('should identify greeting intent', () => {
      const result = parseBookingIntent('Hello');
      expect(result.intent).toBe('greeting');
    });

    test('should identify view intent', () => {
      const result = parseBookingIntent('Show me events');
      expect(result.intent).toBe('view');
    });
  });
});