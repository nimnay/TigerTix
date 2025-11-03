/**
 * parser.test.js
 * Unit Tests for LLM Parser Service
 * Tests the parsing logic for different user intents
 * Includes tests for greeting, viewing events, and booking tickets
 */
require('dotenv').config();
const { parseBookingRequest, fallbackParser } = require('../../services/llmParser');

describe('LLM Parser Unit Tests', () => {
  describe('parseBookingRequest', () => {
    test('should identify greeting intent', async () => {
      const result = await parseBookingRequest('Hello');
      expect(result.intent).toBe('greeting');
    });

    test('should identify view intent', async () => {
      const result = await parseBookingRequest('Show me events');
      expect(result.intent).toBe('view');
    });

    test('should parse valid booking request', async () => {
      const result = await parseBookingRequest('Book 2 tickets for AI Tech Expo');
      expect(result.intent).toBe('book');
      expect(result.event).toBeDefined();
      expect(result.tickets).toBe(2);
    });

    test('should handle invalid input gracefully', async () => {
      const result = await parseBookingRequest('');
      // Empty input falls back to chat intent
      expect(result.intent).toBe('chat');
      expect(result.response).toBeDefined();
    });
  });

  describe('fallbackParser (Unit Tests)', () => {
    test('should detect greeting', () => {
      const result = fallbackParser('Hello');
      expect(result.intent).toBe('greeting');
    });

    test('should detect view intent', () => {
      const result = fallbackParser('Show available events');
      expect(result.intent).toBe('view');
    });

    test('should parse booking with ticket count', () => {
      const result = fallbackParser('Book 2 tickets for Jazz Night');
      expect(result.intent).toBe('book');
      expect(result.event).toBe('jazz night');
      expect(result.tickets).toBe(2);
    });

    test('should default to 1 ticket if count not specified', () => {
      const result = fallbackParser('Book ticket for Concert');
      expect(result.intent).toBe('book');
      expect(result.tickets).toBe(1);
    });

    test('should handle unclear input', () => {
      const result = fallbackParser('random gibberish xyz123');
      // Unclear input falls back to chat intent with helpful message
      expect(result.intent).toBe('chat');
      expect(result.response).toBeDefined();
      expect(result.response).toContain('TigerTix');
    });

    test('should extract event name from "for" pattern', () => {
      const result = fallbackParser('I want to book for AI Tech Expo');
      expect(result.intent).toBe('book');
      expect(result.event).toContain('ai tech expo');
    });
  });
});