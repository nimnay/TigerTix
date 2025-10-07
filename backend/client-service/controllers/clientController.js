// Handles incoming requests from frontend and calls appropriate model functions
// Returns responses back as JSON

const clientModel = require('../models/clientModel');

/**
 * Purpose: Handle request to get all events
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @return {void} - Sends JSON response with events or error message
 * Side effects: Calls model function to fetch events from database
 */
exports.getEvents = (req, res) => {
    clientModel.getAllEvents((err, events) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
        res.json(events);
    });
};

/**
 * Purpose: Handle request to purchase a ticket for an event
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @return {void} - Sends JSON response with success or error message
 * Side effects: Calls model function to update ticket count in database
 */
exports.purchase = (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
    }           
    clientModel.purchaseTicket(eventId, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
}