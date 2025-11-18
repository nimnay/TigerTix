const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByUsername, getUserByEmail } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

/**
 * Registers a new user in the system
 * 
 * @async
 * @function register
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - User's chosen username
 * @param {string} req.body.password - User's password (will be hashed)
 * @param {string} req.body.email - User's email address
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message or error
 * @returns {201} User registered successfully
 * @returns {400} Missing required fields
 * @returns {409} Username or email already exists
 * @returns {500} Internal server error
 */
async function register(req, res) {
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(username, hashedPassword, email);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Authenticates a user and returns a JWT token
 * 
 * @async
 * @function login
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - User's username
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with JWT token or error
 * @returns {200} Login successful with token
 * @returns {401} Invalid credentials (user not found or wrong password)
 * @returns {500} Internal server error
 * 
 */
async function login(req, res) {
    try {
        const { identity, password } = req.body;

        const isEmail = identity.includes("@");

        const user = isEmail
            ? await getUserByEmail(identity)
            : await getUserByUsername(identity);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30m' });
        res.json({ token, username: user.username, message: "Login successful" });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Logs out a user by clearing the authentication cookie
 * 
 * Note: For JWT-based authentication, the actual token invalidation
 * must be handled on the client side by deleting the stored token.
 * This endpoint only clears the cookie if authentication is cookie-based.
 * 
 * @function logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 * @returns {200} Logout successful
 * @returns {500} Internal server error
 * 
 * @example
 */
function logout(req, res) {
    try {
        // For JWT, logout is handled on the client side by deleting the token
        res.clearCookie('token');
        res.json({ message: 'Logout successful on client side' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    register,
    login,
    logout
};