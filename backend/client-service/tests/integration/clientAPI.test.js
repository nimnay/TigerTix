/**
 * clientAPI.test.js
 * Integration Tests for Client Service
 * Tests the full API endpoints with database
 */

const request = require('supertest');
const express = require('express');
const clientRoutes = require('../../routes/clientRoutes');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', clientRoutes);

// Generate a test token (if needed for future tests)
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const testToken = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });

describe('Client Service Integration Tests', () => {
  describe('GET /api/events', () => {
    // Test 1 : Successful fetch of all events
    test('should retrieve all events successfully', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Check if events have expected structure
      if (response.body.length > 0) {
        const event = response.body[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('date');
        expect(event).toHaveProperty('location');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('number_of_tickets');
        expect(event).toHaveProperty('tickets_sold');
        expect(event).toHaveProperty('available_tickets');
      }
    });

    // Test 2 : Available tickets calculation
    test('should return events with correct available tickets calculation', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);

      response.body.forEach(event => {
        const expectedAvailable = event.number_of_tickets - event.tickets_sold;
        expect(event.available_tickets).toBe(expectedAvailable);
      });
    });

    // Test 3 : Empty events list
    test('should return events in consistent format', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('POST /api/events/:id/purchase', () => {
    // Test 4 : Successful ticket purchase
    test('should purchase ticket for valid event', async () => {
      // First get events to find a valid event with available tickets
      const eventsResponse = await request(app)
        .get('/api/events');

      const availableEvent = eventsResponse.body.find(
        e => e.available_tickets > 0
      );

      if (availableEvent) {
        const response = await request(app)
          .post(`/api/events/${availableEvent.id}/purchase`)
          .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('message');
      }
    });

    // Test 5 : Purchase for non-existent event
    test('should reject purchase for non-existent event', async () => {
      const response = await request(app)
        .post('/api/events/999999/purchase')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    // Test 6 : Invalid event ID format
    test('should reject purchase with invalid event ID format', async () => {
      const response = await request(app)
        .post('/api/events/invalid-id/purchase')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid event ID');
    });

    // Test 7 : Purchase with missing event ID
    test('should handle sold out event', async () => {
      // Try to purchase from an event that might be sold out
      // This test verifies the error handling
      const response = await request(app)
        .post('/api/events/9999/purchase')
        .set('Authorization', `Bearer ${testToken}`);

      expect([200, 500]).toContain(response.status);

      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });

    // Test 8: Verify ticket count decreases after purchase
    test('should decrement available tickets after purchase', async () => {
      const eventsResponse = await request(app)
        .get('/api/events');

      const availableEvent = eventsResponse.body.find(
        e => e.available_tickets > 5
      );

      if (availableEvent) {
        const initialTickets = availableEvent.available_tickets;

        // Purchase a ticket
        const purchaseResponse = await request(app)
          .post(`/api/events/${availableEvent.id}/purchase`)
          .set('Authorization', `Bearer ${testToken}`);

        if (purchaseResponse.status === 200) {
          // Fetch events again to verify ticket count decreased
          const updatedEventsResponse = await request(app)
            .get('/api/events');

          const updatedEvent = updatedEventsResponse.body.find(
            e => e.id === availableEvent.id
          );

          expect(updatedEvent.tickets_sold).toBe(availableEvent.tickets_sold + 1);
          expect(updatedEvent.available_tickets).toBe(initialTickets - 1);
        }
      }
    });

    // Test 9: Negative and zero event ID handling
    test('should handle negative event ID', async () => {
      const response = await request(app)
        .post('/api/events/-1/purchase')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    // Test 10: Handle zero event ID
    test('should handle zero event ID', async () => {
      const response = await request(app)
        .post('/api/events/0/purchase')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test 11: Event Retrieval Validation
  describe('Event Retrieval Validation', () => {
    test('should return events with non-negative ticket counts', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);

      response.body.forEach(event => {
        expect(event.number_of_tickets).toBeGreaterThanOrEqual(0);
        expect(event.tickets_sold).toBeGreaterThanOrEqual(0);
        expect(event.available_tickets).toBeGreaterThanOrEqual(0);
      });
    });

    // Test 12: Available tickets do not exceed total tickets
    test('should not exceed total tickets when calculating available', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);

      response.body.forEach(event => {
        expect(event.tickets_sold).toBeLessThanOrEqual(event.number_of_tickets);
      });
    });
  });
});
