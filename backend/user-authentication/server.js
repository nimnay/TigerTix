const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json()); // parse JSON bodies
app.use(cookieParser()); // parse cookies

app.use('/auth', authRoutes);

app.listen(3001, () => console.log('Server running on port 3001'));
