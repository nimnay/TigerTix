const express = require('express');
const LLMController = require('../controllers/llmController');

const router = express.Router();

// Parse natural language booking request
router.post('/parse', LLMController.parse);

// Confirm booking
router.post('/confirm', LLMController.confirm);

module.exports = router;