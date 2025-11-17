const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors'); 
const authRouter = require('./routers/authRouter');

const app = express();

// CORS MUST be added 
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);

app.listen(3001, () => {
    console.log('User Authentication Service running on port 3001');
});
