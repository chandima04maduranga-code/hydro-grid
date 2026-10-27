const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');
const requireCompanyUser = require('../middleware/requireCompanyUser');
const requireRole = require('../middleware/requireRole');
const mongoose = require('mongoose');
const Greenhouse = require('../models/Greenhouse');
const { greenhouseFilterFor, visibleGreenhouseIds } = require('../services/access');

router.use(auth, requireCompanyUser);

// @route   GET /api/plants
// @desc    Get the company's plants: all for admins, only those in assigned
//          greenhouses for other staff
// @access  Company users
router.get('/', async (req, res) => {
  try {
    const visible = await visibleGreenhouseIds(req.user);
    const filter = visible === null ? { company: req.companyId } : { company: req.companyId, greenhouse: { $in: visible } };
    const plants = await Plant.find(filter).populate('greenhouse', 'code name district number').sort({ createdAt: -1 });
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
  const { name, species, healthStatus, cropType, systemId, growthStage, image, greenhouse } = req.body;

  try {
    if (greenhouse) {
      const allowed = mongoose.isValidObjectId(greenhouse)
        && await Greenhouse.exists({ _id: greenhouse, ...greenhouseFilterFor(req.user) });
      if (!allowed) return res.status(404).json({ code: 'GREENHOUSE_NOT_FOUND', message: 'Greenhouse not found' });
    }

    const plant = await Plant.create({
      company: req.companyId,
      greenhouse: greenhouse || null,
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
