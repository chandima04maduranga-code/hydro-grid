const express = require('express');
const router = express.Router();
const SensorLog = require('../models/SensorLog');
const auth = require('../middleware/auth');

// @route   GET /api/sensors
// @desc    Get all sensor logs for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Only fetch logs that belong to the logged-in user
    const logs = await SensorLog.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/sensors
// @desc    Add new sensor reading
// @access  Private
router.post('/', auth, async (req, res) => {
  const { temperature, moisture } = req.body;

  try {
    const newLog = new SensorLog({
      userId: req.user.id, // Comes from the auth middleware
      temperature,
      moisture
    });

    const log = await newLog.save();
    res.json(log);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;