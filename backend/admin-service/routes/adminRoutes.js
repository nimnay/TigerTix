const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');


router.post('/api/events', adminController.createEvent);

module.exports = router;