const { parse } = require('../../services/llmParser');

describe('LLM Parser Unit Tests', () => {
  test('should identify greeting intent', async () => {
    const result = await parse('Hello');
    expect(result.intent).toBe('greeting');
    expect(result.response).toBeDefined();
  });

  test('should identify view intent', async () => {
    const result = await parse('Show me events');
    expect(result.intent).toBe('view');
  });

  test('should parse valid booking request', async () => {
    const result = await parse('Book 2 tickets for AI Tech Expo');
    expect(result.intent).toBe('book');
    expect(result.booking).toBeDefined();
    expect(result.booking.tickets).toBe(2);
  });

  test('should handle invalid input gracefully', async () => {
    const result = await parse('');
    expect(result.error).toBeDefined();
  });
});