const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'This is a protected profile route', userId: req.userId });
});

module.exports = router;