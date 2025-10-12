/**
 * adminRoutes.js
 * Defines routes for admin operations.
 * Uses adminController to handle requests.
 * Route for creating a new event in the events table.
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route to create a new event
// POST /api/events
router.post('/events', adminController.createEvent);

module.exports = router;