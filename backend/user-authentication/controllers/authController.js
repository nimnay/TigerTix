const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByUsername, getUserByEmail } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

async function register(req, res) {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(username, hashedPassword, email);
    res.status(201).json({ message: 'User registered successfully' });
}

async function login(req, res) {
    const { username, password } = req.body;

    const user = await getUserByUsername(username);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30m' });
    res.json({ token, message: "Login successful" });
}

function logout(req, res) {
    // For JWT, logout is handled on the client side by deleting the token
    res.clearCookie('token');
    res.json({ message: 'Logout successful on client side' });
}

module.exports = {
    register,
    login,
    logout
};