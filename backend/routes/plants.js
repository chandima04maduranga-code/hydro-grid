const express = require('express');
const mongoose = require('mongoose');
const Plant = require('../models/Plant');
const Greenhouse = require('../models/Greenhouse');
const auth = require('../middleware/auth');
const requireCompanyUser = require('../middleware/requireCompanyUser');
const requireRole = require('../middleware/requireRole');
const { greenhouseFilterFor, visibleGreenhouseIds } = require('../services/access');
const { CROP_TYPES, GROWTH_STAGES, HEALTH_STATUSES, SORTS, validatePlant } = require('../config/plants');

const router = express.Router();
router.use(auth, requireCompanyUser);

const GREENHOUSE_FIELDS = 'code name district number mainCrop';
const EDITOR_ROLES = ['admin', 'farm_manager'];

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

const validationError = (res, errors) =>
  res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields', errors });

const notFound = (res) => res.status(404).json({ code: 'PLANT_NOT_FOUND', message: 'Crop not found' });

// Escapes text so a search box value is matched literally
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Crops this user may see: admins see every crop of the company,
// other staff only crops in their assigned greenhouses
const visibleFilter = async (req) => {
  const visible = await visibleGreenhouseIds(req.user);
  return visible === null
    ? { company: req.companyId }
    : { company: req.companyId, greenhouse: { $in: visible } };
};

const findVisiblePlant = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return Plant.findOne({ _id: req.params.id, ...(await visibleFilter(req)) });
};

// The greenhouse must belong to the company and be one the user works in
const canUseGreenhouse = (req, greenhouseId) =>
  Greenhouse.exists({ _id: greenhouseId, ...greenhouseFilterFor(req.user) });

// @route   GET /api/plants/options
// @desc    Crop types, growth stages, health statuses and sort orders
// @access  Company users
router.get('/options', (req, res) => {
  res.json({ cropTypes: CROP_TYPES, growthStages: GROWTH_STAGES, healthStatuses: HEALTH_STATUSES, sorts: Object.keys(SORTS) });
});

// @route   GET /api/plants?q=&greenhouse=&cropType=&growthStage=&healthStatus=&sort=
// @desc    Crops the user may see, with search (name or species), filters and sorting
// @access  Company users
router.get('/', async (req, res) => {
  const { q, greenhouse, cropType, growthStage, healthStatus, sort } = req.query;

  try {
    const filter = await visibleFilter(req);
    if (typeof q === 'string' && q.trim()) {
      const pattern = new RegExp(escapeRegex(q.trim().slice(0, 80)), 'i');
      filter.$or = [{ name: pattern }, { species: pattern }];
    }
    if (typeof greenhouse === 'string' && greenhouse) {
      // Staff may only narrow to a greenhouse they can already see
      const allowed = mongoose.isValidObjectId(greenhouse)
        && (!filter.greenhouse || filter.greenhouse.$in.some((id) => String(id) === greenhouse));
      filter.greenhouse = allowed ? greenhouse : { $in: [] };
    }
    if (CROP_TYPES.includes(cropType)) filter.cropType = cropType;
    if (GROWTH_STAGES.includes(growthStage)) filter.growthStage = growthStage;
    if (HEALTH_STATUSES.includes(healthStatus)) filter.healthStatus = healthStatus;

    const plants = await Plant.find(filter)
      .populate('greenhouse', GREENHOUSE_FIELDS)
      .sort(SORTS[sort] || SORTS.newest)
      .limit(500);
    res.json(plants);
  } catch (err) {
    serverError(res, 'List crops error', err);
  }
});

// @route   GET /api/plants/:id
// @desc    One crop with its greenhouse and who created / last changed it
// @access  Company users who can see the crop
router.get('/:id', async (req, res) => {
  try {
    const plant = await findVisiblePlant(req);
    if (!plant) return notFound(res);
    await plant.populate([
      { path: 'greenhouse', select: GREENHOUSE_FIELDS },
      { path: 'createdBy', select: 'name' },
      { path: 'updatedBy', select: 'name' }
    ]);
    res.json(plant);
  } catch (err) {
    serverError(res, 'Get crop error', err);
  }
});

// @route   POST /api/plants
// @desc    Add a crop to one of the user's greenhouses
// @access  Company admins and farm managers
router.post('/', requireRole(...EDITOR_ROLES), async (req, res) => {
  const { errors, values } = validatePlant(req.body);
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  try {
    if (!(await canUseGreenhouse(req, values.greenhouse))) return validationError(res, { greenhouse: 'GREENHOUSE_NOT_FOUND' });

    const plant = await Plant.create({ ...values, company: req.companyId, createdBy: req.user._id, updatedBy: req.user._id });
    await plant.populate('greenhouse', GREENHOUSE_FIELDS);
    res.status(201).json(plant);
  } catch (err) {
    serverError(res, 'Create crop error', err);
  }
});

// @route   PATCH /api/plants/:id
// @desc    Edit a crop (only the fields that are sent)
// @access  Company admins and farm managers who can see the crop
router.patch('/:id', requireRole(...EDITOR_ROLES), async (req, res) => {
  const { errors, values } = validatePlant(req.body, { partial: true });
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  try {
    const plant = await findVisiblePlant(req);
    if (!plant) return notFound(res);
    if (values.greenhouse && !(await canUseGreenhouse(req, values.greenhouse))) {
      return validationError(res, { greenhouse: 'GREENHOUSE_NOT_FOUND' });
    }

    // Dates are checked again against the values already stored
    const plantedOn = values.plantedOn !== undefined ? values.plantedOn : plant.plantedOn;
    const harvestOn = values.expectedHarvestOn !== undefined ? values.expectedHarvestOn : plant.expectedHarvestOn;
    if (plantedOn && harvestOn && harvestOn < plantedOn) return validationError(res, { expectedHarvestOn: 'HARVEST_BEFORE_PLANTING' });

    plant.set({ ...values, updatedBy: req.user._id });
    await plant.save();
    await plant.populate('greenhouse', GREENHOUSE_FIELDS);
    res.json(plant);
  } catch (err) {
    serverError(res, 'Update crop error', err);
  }
});

// @route   DELETE /api/plants/:id
// @desc    Remove a crop record (the UI asks for confirmation first)
// @access  Company admins and farm managers who can see the crop
router.delete('/:id', requireRole(...EDITOR_ROLES), async (req, res) => {
  try {
    const plant = await findVisiblePlant(req);
    if (!plant) return notFound(res);
    await plant.deleteOne();
    res.status(204).end();
  } catch (err) {
    serverError(res, 'Delete crop error', err);
  }
});

module.exports = router;
