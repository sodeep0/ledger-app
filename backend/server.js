//server.js

//import required packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const customerRoutes = require('./routes/customerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
//connect to the database
connectDB();

//initialize the express app
const app = express();

//set the port from environment variable or default to 5000
const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200 // For legacy browser support
  };
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions)); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
//start the server and listen for incoming requests
// In server.js
app.get('/', (req, res) => {
    res.status(200).send('Server is awake!');
  });
app.listen(PORT);

