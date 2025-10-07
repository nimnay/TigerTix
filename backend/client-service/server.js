// Our server for client-service

const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/clientRoutes');
// Run setup (creates table if needed)
require('./setup');


app.use(cors());
app.use(express.json());

//Register routes with /api prefix
app.use('/api', routes);

//Port for client-service
const PORT = 6001;

app.listen(PORT, () => console.log(`Server running at
http://localhost:${PORT}`));