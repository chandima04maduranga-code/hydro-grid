const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // IMPORT CORS
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // ENABLE CORS FOR FRONTEND
app.use(express.json());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/sensors', require('./routes/sensors'));

// Connect to actual MongoDB Atlas Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to ACTUAL MongoDB Atlas Database!'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:');
    console.error(err);
  });

// Basic Test Route
app.get('/', (req, res) => {
  res.send('Hydro Grid Backend is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));