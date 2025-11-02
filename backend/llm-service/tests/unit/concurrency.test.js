const request = require('supertest');
const app = require('../../server');

describe('Database Concurrency Tests', () => {
  test('should handle concurrent booking requests', async () => {
    const eventId = 1001;
    
    // Get initial ticket count
    const initialResponse = await request(app)
      .post('/api/llm/parse')
      .send({ text: 'Show available events' });
    
    const initialEvent = initialResponse.body.events.find(e => e.id === eventId);
    const initialSold = initialEvent.tickets_sold;
    
    // Try to book 3 tickets concurrently
    const promises = Array(3).fill(null).map(() =>
      request(app)
        .post('/api/llm/confirm')
        .send({ eventId, tickets: 1 })
    );

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.body.success).length;

    // Check final state
    const finalResponse = await request(app)
      .post('/api/llm/parse')
      .send({ text: 'Show available events' });
    
    const finalEvent = finalResponse.body.events.find(e => e.id === eventId);
    
    // Verify tickets were sold correctly
    expect(finalEvent.tickets_sold).toBe(initialSold + successful);
    expect(successful).toBeGreaterThan(0);
    expect(successful).toBeLessThanOrEqual(3);
  }, 10000);
});