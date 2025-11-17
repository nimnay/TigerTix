const express = require('express');
const cookieParser = require('cookie-parser');
const authRouter = require('./routers/authRouter');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);

app.listen(3001, () => {
    console.log('User Authentication Service running on port 3001');
});
