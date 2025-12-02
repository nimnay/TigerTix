const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors'); 
const authRouter = require('./routers/authRouter');
const setup = require('./setup');

const app = express();

// CORS MUST be added 
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tiger-tix-omega.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);

// Initialize database before starting server
setup()
  .then(() => {
    app.listen(3001, () => {
      console.log('User Authentication Service running on port 3001');
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
