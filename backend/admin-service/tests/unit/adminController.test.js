/**
 * Unit Tests for Admin Controller
 * Tests validation logic and controller functions
 */

const adminController = require('../../controllers/adminController');
const adminModel = require('../../models/adminModel');

// Mock the adminModel
jest.mock('../../models/adminModel');

describe('Admin Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createEvent', () => {
    test('should create event with valid data', () => {
      const validEvent = {
        name: 'Test Concert',
        date: '2025-12-01',
        number_of_tickets: 100,
        location: 'Memorial Stadium',
        description: 'A great concert'
      };

      req.body = validEvent;

      adminModel.createEvent.mockImplementation((event, callback) => {
        callback(null, { id: 1, ...event });
      });

      adminController.createEvent(req, res);

      expect(adminModel.createEvent).toHaveBeenCalledWith(
        validEvent,
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, ...validEvent });
    });

    test('should reject event with missing name', () => {
      req.body = {
        date: '2025-12-01',
        number_of_tickets: 100,
        location: 'Memorial Stadium',
        description: 'A great concert'
      };

      adminController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event data' });
      expect(adminModel.createEvent).not.toHaveBeenCalled();
    });

    test('should reject event with invalid date', () => {
      req.body = {
        name: 'Test Concert',
        date: 'invalid-date',
        number_of_tickets: 100,
        location: 'Memorial Stadium',
        description: 'A great concert'
      };

      adminController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event data' });
    });

    test('should reject event with negative ticket count', () => {
      req.body = {
        name: 'Test Concert',
        date: '2025-12-01',
        number_of_tickets: -10,
        location: 'Memorial Stadium',
        description: 'A great concert'
      };

      adminController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event data' });
    });

    test('should reject event with non-integer ticket count', () => {
      req.body = {
        name: 'Test Concert',
        date: '2025-12-01',
        number_of_tickets: 10.5,
        location: 'Memorial Stadium',
        description: 'A great concert'
      };

      adminController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event data' });
    });

    test('should reject event with missing location', () => {
      req.body = {
        name: 'Test Concert',
        date: '2025-12-01',
        number_of_tickets: 100,
        description: 'A great concert'
      };

      adminController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event data' });
    });

    test('should reject event with missing description', () => {
      req.body = {
        name: 'Test Concert',
        date: '2025-12-01',
        number_of_tickets: 100,
        location: 'Memorial Stadium'
      };

      adminController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event data' });
    });

    test('should handle database error gracefully', () => {
      const validEvent = {
        name: 'Test Concert',
        date: '2025-12-01',
        number_of_tickets: 100,
        location: 'Memorial Stadium',
        description: 'A great concert'
      };

      req.body = validEvent;

      adminModel.createEvent.mockImplementation((event, callback) => {
        callback(new Error('Database error'));
      });

      adminController.createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create event' });
    });

    test('should accept event with zero tickets', () => {
      const validEvent = {
        name: 'Free Event',
        date: '2025-12-01',
        number_of_tickets: 0,
        location: 'Memorial Stadium',
        description: 'A free event'
      };

      req.body = validEvent;

      adminModel.createEvent.mockImplementation((event, callback) => {
        callback(null, { id: 1, ...event });
      });

      adminController.createEvent(req, res);

      expect(adminModel.createEvent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
