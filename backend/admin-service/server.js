/**
 * server.js
 * Sets up the Express server for the admin service.
 * Defines routes and middleware.
 * Listens on port 5001.
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const setup = require('./setup');

const app = express();

// Middleware to parse JSON bodies and cookies
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tiger-tix-omega.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Initialize database before starting server
const PORT = process.env.PORT || 5001;
setup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Admin service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });