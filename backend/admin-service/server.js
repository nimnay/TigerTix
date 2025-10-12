/**
 * server.js
 * Sets up the Express server for the admin service.
 * Defines routes and middleware.
 * Listens on port 5001.
 */
const express = require('express');
const router = express.Router();
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use('/admin', adminRoutes);

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Admin service running on port ${PORT}`);
});