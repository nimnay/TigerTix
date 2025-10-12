const express = require('express');
const router = express.Router();
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Admin service running on port ${PORT}`);
});