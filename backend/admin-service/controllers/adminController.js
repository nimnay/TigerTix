const adminModel = require('../models/adminModel');

exports.createEvent = (req, res) => {
    const { name, date, number_of_tickets, location, description } = req.body;
    const event = { name, date, number_of_tickets, location, description };

    adminModel.createEvent(event, (err, newEvent) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to create event' });
        }
        res.status(201).json(newEvent);
    });
};