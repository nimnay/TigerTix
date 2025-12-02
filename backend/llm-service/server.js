// Our server for llm-service, ensures env is configured 


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const llmRoutes = require('./routes/llmRoutes');
const setup = require('./setup');

const app = express();
const PORT = process.env.PORT || 7001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tiger-tix-omega.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/llm', llmRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'LLM Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Only start server if not in test mode
if (require.main === module) {
  // Initialize database before starting server
  setup()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`LLM Service running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = app;
