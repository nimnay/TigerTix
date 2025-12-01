// Our server for client-service

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const routes = require('./routes/clientRoutes');
// Run setup (creates table if needed)
require('./setup');


app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ticketsystem.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//Register routes with /api prefix
app.use('/api', routes);

//Port for client-service
const PORT = 6001;

app.listen(PORT, () => console.log(`Client Service running at
http://localhost:${PORT}`));