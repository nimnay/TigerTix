const express = require('express');
const LLMController = require('../controllers/llmController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Parse natural language booking request (protected)
router.post('/parse', authMiddleware, LLMController.parse);

// Confirm booking (protected)
router.post('/confirm', authMiddleware, LLMController.confirm);

module.exports = router;