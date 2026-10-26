const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');
const requireCompanyUser = require('../middleware/requireCompanyUser');
const requireRole = require('../middleware/requireRole');

router.use(auth, requireCompanyUser);

// @route   GET /api/plants
// @desc    Get the company's plants
// @access  Company users
router.get('/', async (req, res) => {
  try {
    const plants = await Plant.find({ company: req.companyId }).sort({ createdAt: -1 });
    res.json(plants);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
  }
});

// @route   POST /api/plants
// @desc    Add a plant to the company (full plant management comes later)
// @access  Company admins and farm managers
router.post('/', requireRole('admin', 'farm_manager'), async (req, res) => {
  const { name, species, healthStatus, cropType, systemId, growthStage, image } = req.body;

  try {
    const plant = await Plant.create({
      company: req.companyId,
      name,
      species,
      healthStatus,
      cropType,
      systemId,
      growthStage,
      image
    });
    res.status(201).json(plant);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please check the plant details' });
  }
});

module.exports = router;
