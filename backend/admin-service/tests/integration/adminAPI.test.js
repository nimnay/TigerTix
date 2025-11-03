/**
 * Integration Tests for Admin Service
 * Tests the full API endpoints with database
 */

const request = require('supertest');
const express = require('express');
const adminRoutes = require('../../routes/adminRoutes');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Service Integration Tests', () => {
  describe('POST /api/admin/events', () => {
    test('should create a new event successfully', async () => {
      const newEvent = {
        name: 'Test Integration Concert',
        date: '2025-12-15',
        number_of_tickets: 500,
        location: 'Death Valley Stadium',
        description: 'Integration test event'
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newEvent.name);
      expect(response.body.date).toBe(newEvent.date);
      expect(response.body.number_of_tickets).toBe(newEvent.number_of_tickets);
      expect(response.body.location).toBe(newEvent.location);
      expect(response.body.description).toBe(newEvent.description);
    });

    test('should reject event with missing required fields', async () => {
      const invalidEvent = {
        name: 'Incomplete Event',
        date: '2025-12-15'
        // Missing other fields
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(invalidEvent);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid event data');
    });

    test('should reject event with invalid date format', async () => {
      const invalidEvent = {
        name: 'Bad Date Event',
        date: 'not-a-date',
        number_of_tickets: 100,
        location: 'Stadium',
        description: 'Test'
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(invalidEvent);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid event data');
    });

    test('should reject event with negative tickets', async () => {
      const invalidEvent = {
        name: 'Negative Tickets Event',
        date: '2025-12-15',
        number_of_tickets: -50,
        location: 'Stadium',
        description: 'Test'
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(invalidEvent);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid event data');
    });

    test('should reject empty request body', async () => {
      const response = await request(app)
        .post('/api/admin/events')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid event data');
    });

    test('should accept event with large ticket count', async () => {
      const largeEvent = {
        name: 'Large Capacity Event',
        date: '2025-12-20',
        number_of_tickets: 10000,
        location: 'Large Stadium',
        description: 'Big event'
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(largeEvent);

      expect(response.status).toBe(201);
      expect(response.body.number_of_tickets).toBe(10000);
    });

    test('should handle special characters in event name', async () => {
      const specialEvent = {
        name: 'Rock & Roll: The "Best" Concert!',
        date: '2025-12-25',
        number_of_tickets: 200,
        location: 'Music Hall',
        description: 'Special chars test'
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(specialEvent);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(specialEvent.name);
    });

    test('should reject event with non-string name', async () => {
      const invalidEvent = {
        name: 12345,
        date: '2025-12-15',
        number_of_tickets: 100,
        location: 'Stadium',
        description: 'Test'
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(invalidEvent);

      expect(response.status).toBe(400);
    });

    test('should handle future dates correctly', async () => {
      const futureEvent = {
        name: 'Future Event',
        date: '2026-06-01',
        number_of_tickets: 300,
        location: 'Future Stadium',
        description: 'Event in the future'
      };

      const response = await request(app)
        .post('/api/admin/events')
        .send(futureEvent);

      expect(response.status).toBe(201);
    });
  });
});
