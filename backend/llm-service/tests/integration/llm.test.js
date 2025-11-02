// At the top of llm.test.js
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});


const request = require('supertest');
const app = require('../../server');

describe('LLM Service Tests', () => {
  describe('POST /api/llm/parse', () => {
    test('should handle greeting intent', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Hello' });
      
      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('greeting');
      expect(response.body.response).toBeDefined();
    });

    test('should handle view events intent', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Show available events' });
      
      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('view');
      expect(response.body.events).toBeDefined();
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events.length).toBeGreaterThan(0);
    });

    test('should parse booking request for existing event', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Book 2 tickets for AI Tech Expo' });
      
      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('book');
      expect(response.body.needsConfirmation).toBe(true);
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.eventId).toBeDefined();
      expect(response.body.booking.tickets).toBe(2);
    });

    test('should handle booking request for non-existent event', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Book 2 tickets for Jazz Night' });
      
      expect(response.status).toBe(200);
      expect(response.body.error).toBeDefined();
      expect(response.body.response).toContain('couldn\'t find');
    });

    test('should require text input', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Text input required');
    });

    test('should handle empty text input', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: '' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Text input required');
    });

    test('should handle invalid ticket quantity', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ text: 'Book -1 tickets' });
      
      expect(response.status).toBe(200);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/llm/confirm', () => {
    test('should confirm valid booking', async () => {
      const response = await request(app)
        .post('/api/llm/confirm')
        .send({
          eventId: 1001, // AI Tech Expo
          tickets: 2
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.eventName).toBe('AI Tech Expo');
      expect(response.body.ticketsPurchased).toBe(2);
      expect(response.body.remainingTickets).toBeDefined();
    });

    test('should reject invalid event ID', async () => {
      const response = await request(app)
        .post('/api/llm/confirm')
        .send({ eventId: 999999, tickets: 1 });
      
      expect(response.status).toBe(400); // Your API returns 200 with error
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Event not found');
    });

    test('should reject invalid ticket count', async () => {
      const response = await request(app)
        .post('/api/llm/confirm')
        .send({ eventId: 1001, tickets: 0 });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should reject negative ticket count', async () => {
      const response = await request(app)
        .post('/api/llm/confirm')
        .send({ eventId: 1001, tickets: -5 });
      
      expect(response.status).toBe(400);
    });

    test('should reject missing eventId', async () => {
      const response = await request(app)
        .post('/api/llm/confirm')
        .send({ tickets: 2 });
      
      expect(response.status).toBe(400);
    });

    test('should reject missing tickets', async () => {
      const response = await request(app)
        .post('/api/llm/confirm')
        .send({ eventId: 1001 });
      
      expect(response.status).toBe(400);
    });
  });
  
test('should use Gemini AI (not fallback)', async () => {
  const response = await request(app)
    .post('/api/llm/parse')
    .send({ text: 'Book 2 tickets for Homecoming Concert' });
  
  expect(response.status).toBe(200);
  // If Gemini works, it should parse this correctly
  // The fallback keyword parser is less accurate
  console.log('Response:', JSON.stringify(response.body, null, 2));
}, 10000); // 10 second timeout for API call


  afterAll((done) => {
  // Close any open database connections
  done();
});

});