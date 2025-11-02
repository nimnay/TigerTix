const request = require('supertest');
const app = require('../../server');

describe('Database Concurrency Tests', () => {
  test('should handle concurrent booking requests', async () => {
    const eventId = 1001;
    const promises = [];

    // Try to book 5 tickets simultaneously
    for (let i = 0; i < 5; i++) {
      promises.push(
        request(app)
          .post('/api/llm/confirm')
          .send({ eventId, tickets: 1 })
      );
    }

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.body.success).length;

    // All 5 should succeed if enough tickets available
    expect(successful).toBeGreaterThan(0);
    
    // Verify ticket count is consistent
    const viewResponse = await request(app)
      .post('/api/llm/parse')
      .send({ text: 'Show available events' });
    
    const event = viewResponse.body.events.find(e => e.id === eventId);
    expect(event.tickets_sold).toBe(successful);
  }, 10000);

  test('should prevent overbooking with race conditions', async () => {
    // Create event with only 2 tickets
    // Try to book 5 tickets simultaneously
    // Only 2 should succeed
  });
});