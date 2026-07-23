const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');

// @route   GET /api/plants
// @desc    Get all plants
// @access  Public
router.get('/', async (req, res) => {
  try {
    const plants = await Plant.find().sort({ createdAt: -1 });
    res.json(plants);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/plants
// @desc    Add new plant
// @access  Private (Requires login token)
router.post('/', auth, async (req, res) => {
  const { name, species, description, imageUrl, optimalTemperature, optimalMoisture } = req.body;

  try {
    const newPlant = new Plant({
      name,
      species,
      description,
      imageUrl,
      optimalTemperature,
      optimalMoisture
    });

    const plant = await newPlant.save();
    res.json(plant);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;