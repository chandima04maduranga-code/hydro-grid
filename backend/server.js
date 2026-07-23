const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());

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