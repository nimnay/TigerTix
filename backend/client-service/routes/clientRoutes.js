// Maps URL paths to controller functions for client-related operations

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all events (public - no auth required)
router.get('/events', clientController.getEvents);

// Purchase a ticket (protected - requires authentication)
router.post('/events/:id/purchase', authMiddleware, clientController.purchase);

module.exports = router;