// Our server for llm-service, ensures env is configured 


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const llmRoutes = require('./routes/llmRoutes');

const app = express();
const PORT = process.env.PORT || 7001;

// Middleware
app.use(cors());
app.use(express.json());

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
  app.listen(PORT, () => {
    console.log(`LLM Service running on port ${PORT}`);
  });
}

module.exports = app;
