const request = require('supertest');
const app = require('../server');

describe('LLM Service Tests', () => {
  describe('POST /api/llm/parse', () => {
    test('should handle greeting intent', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Hello' });
      
      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('greeting');
    });

    test('should handle view events intent', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Show available events' });
      
      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('view');
      expect(response.body.events).toBeDefined();
    });

    test('should parse booking request', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Book 2 tickets for Jazz Night' });
      
      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('book');
      expect(response.body.needsConfirmation).toBe(true);
    });

    test('should require text input', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({});
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/llm/confirm', () => {
    test('should confirm valid booking', async () => {
      // First parse to get event ID
      const parseResponse = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Book 1 ticket for Jazz Night' });
      
      if (parseResponse.body.booking) {
        const confirmResponse = await request(app)
          .post('/api/llm/confirm')
          .send({
            eventId: parseResponse.body.booking.eventId,
            tickets: 1
          });
        
        expect(confirmResponse.status).toBe(200);
        expect(confirmResponse.body.success).toBe(true);
      }
    });

    test('should reject invalid booking data', async () => {
      const response = await request(app)
        .post('/api/llm/confirm')
        .send({ eventId: 999, tickets: -1 });
      
      expect(response.status).toBe(400);
    });
  });
});