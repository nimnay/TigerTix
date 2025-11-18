/**
 * adminRoutes.js
 * Defines routes for admin operations.
 * Uses adminController to handle requests.
 * Route for creating a new event in the events table.
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Route to create a new event (protected - requires authentication)
// POST /api/admin/events
router.post('/events', authMiddleware, adminController.createEvent);

module.exports = router;