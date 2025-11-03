/**
 * clientController.test.js
 * Unit Tests for Client Controller
 * Tests controller functions and validation logic
 */

const clientController = require('../../controllers/clientController');
const clientModel = require('../../models/clientModel');

// Mock the clientModel
jest.mock('../../models/clientModel');

/**
 * Client Controller Unit Tests
 * --------------------
 * Test 1 : Successful fetch of events
 * Test 2 : Database error handling
 * Test 3 : No events available
 * Test 4 : Successful ticket purchase
 * Test 5 : Invalid event ID (non-numeric)
 * Test 6 : Missing event ID
 * Test 7 : Purchase error handling
 * Test 8 : Additional edge case tests
 * --------------------
 */
describe('Client Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getEvents', () => {
    // Test 1 : Successful fetch of events
    test('should return all events successfully', () => {
      const mockEvents = [
        { id: 1, name: 'Event 1', tickets_sold: 10, number_of_tickets: 100 },
        { id: 2, name: 'Event 2', tickets_sold: 50, number_of_tickets: 200 }
      ];

      clientModel.getAllEvents.mockImplementation((callback) => {
        callback(null, mockEvents);
      });

      clientController.getEvents(req, res);

      expect(clientModel.getAllEvents).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockEvents);
      expect(res.status).not.toHaveBeenCalled(); // No error status
    });

    // Test 2 : Database error handling
    test('should handle database error when fetching events', () => {
      clientModel.getAllEvents.mockImplementation((callback) => {
        callback(new Error('Database connection failed'));
      });

      clientController.getEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch events' });
    });

    // Test 3 : No events available
    test('should return empty array when no events exist', () => {
      clientModel.getAllEvents.mockImplementation((callback) => {
        callback(null, []);
      });

      clientController.getEvents(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('purchase', () => {
    // Test 4 : Successful ticket purchase
    test('should purchase ticket successfully with valid event ID', () => {
      req.params.id = '1';

      clientModel.purchaseTicket.mockImplementation((eventId, callback) => {
        callback(null, { success: true, message: 'Ticket purchased successfully' });
      });

      clientController.purchase(req, res);

      expect(clientModel.purchaseTicket).toHaveBeenCalledWith(1, expect.any(Function));
      expect(res.json).toHaveBeenCalledWith({ 
        success: true, 
        message: 'Ticket purchased successfully' 
      });
    });

    // Test 5 : Invalid event ID (non-numeric)
    test('should reject invalid event ID (non-numeric)', () => {
      req.params.id = 'abc';

      clientController.purchase(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event ID' });
      expect(clientModel.purchaseTicket).not.toHaveBeenCalled();
    });

    // Test 6 : Missing event ID
    test('should reject empty event ID', () => {
      req.params.id = '';

      clientController.purchase(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid event ID' });
    });

    // Test 7 : Purchase error handling
    test('should handle purchase error from model', () => {
      req.params.id = '999';

      clientModel.purchaseTicket.mockImplementation((eventId, callback) => {
        callback(new Error('No tickets available or event not found'));
      });

      clientController.purchase(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'No tickets available or event not found' 
      });
    });

    // Test 8 : Additional edge case tests
    test('should handle negative event ID', () => {
      req.params.id = '-5';

      clientController.purchase(req, res);

      // -5 is a valid number, so it should pass validation but might fail in model
      expect(clientModel.purchaseTicket).toHaveBeenCalledWith(-5, expect.any(Function));
    });

    // Test 9 : Handle zero event ID
    test('should handle zero event ID', () => {
      req.params.id = '0';

      clientController.purchase(req, res);

      expect(clientModel.purchaseTicket).toHaveBeenCalledWith(0, expect.any(Function));
    });

    // Test 10 : Handle very large event ID
    test('should handle very large event ID', () => {
      req.params.id = '999999999';

      clientModel.purchaseTicket.mockImplementation((eventId, callback) => {
        callback(null, { success: true, message: 'Ticket purchased successfully' });
      });

      clientController.purchase(req, res);

      expect(clientModel.purchaseTicket).toHaveBeenCalledWith(999999999, expect.any(Function));
    });
  });
});
