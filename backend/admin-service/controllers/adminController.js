/**
 * adminController.js
 * Handles incoming requests related to admin operations.
 * Uses adminModel to interact with the database.
 * Creates a new event in the events table.
 */
const adminModel = require('../models/adminModel');

/**
 * Validates the event data.
 * @param {Object} event - The event object to validate.
 * Properties: name, date, number_of_tickets, location, description
 * @returns {boolean} - True if valid, false otherwise.
 * Side effect: None.
 */
function validateEventData(event) {
    const { name, date, number_of_tickets, location, description } = event;
    if (!name || typeof name !== 'string') return false;
    if (!date || isNaN(Date.parse(date))) return false;
    if (!Number.isInteger(number_of_tickets) || number_of_tickets < 0) return false;
    if (!location || typeof location !== 'string') return false;
    if (!description || typeof description !== 'string') return false;
    return true;
}

/**
 * Creates a new event in the database.
 * @param {Object} req - The request object, containing event data in req.body.
 * @param {Object} res - The response object, used to send back the result.
 * @returns {void} - Sends a JSON response with the created event or an error message.
 * Side effect: Inserts a new event into the events table in the database.
 */
exports.createEvent = (req, res) => {
    const { name, date, number_of_tickets, location, description } = req.body;
    const event = { name, date, number_of_tickets, location, description };

    // Validate event data
    if (!validateEventData(event)) {
        return res.status(400).json({ error: 'Invalid event data' });
    }

    // Create the event using the model
    adminModel.createEvent(event, (err, newEvent) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to create event' });
        }
        res.status(201).json(newEvent);
    });
};