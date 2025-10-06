// Maps URL paths to controller functions for client-related operations

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Get all events (frontend calls this to display events)
router.get('/events', clientController.getEvents);

// Purchase a ticket (frontend calls this when user clicks "Reserve Ticket")
router.post('/events/:id/purchase', clientController.purchase);

module.exports = router;