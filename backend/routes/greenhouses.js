const express = require('express');
const mongoose = require('mongoose');
const Greenhouse = require('../models/Greenhouse');
const SensorNode = require('../models/SensorNode');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireCompanyUser = require('../middleware/requireCompanyUser');
const requireRole = require('../middleware/requireRole');
const { DISTRICTS } = require('../config/districts');
const { CROP_IDS } = require('../config/crops');
const { PLANS } = require('../config/plans');
const { SYSTEM_TYPES, GREENHOUSE_STATUSES, greenhouseCode } = require('../config/greenhouses');
const { greenhouseFilterFor } = require('../services/access');
const { assessNode } = require('../services/advisor');

const router = express.Router();
router.use(auth, requireCompanyUser);

const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const ASSIGNABLE_ROLES = ['farm_manager', 'field_officer'];
const STAFF_FIELDS = 'name email role status';

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

const notFound = (res) => res.status(404).json({ code: 'GREENHOUSE_NOT_FOUND', message: 'Greenhouse not found' });

// Validates the editable fields; `creating` also requires district and name
const validate = (body, creating) => {
  const errors = {};
  if (creating && !DISTRICTS.includes(body.district)) errors.district = 'REQUIRED';
  if ((creating || body.name !== undefined) && (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 80)) errors.name = 'REQUIRED';
  if (body.systemType !== undefined && !SYSTEM_TYPES.includes(body.systemType)) errors.systemType = 'REQUIRED';
  if (body.mainCrop !== undefined && body.mainCrop !== null && body.mainCrop !== '' && !CROP_IDS.includes(body.mainCrop)) errors.mainCrop = 'REQUIRED';
  if (body.areaSqm !== undefined && body.areaSqm !== null && body.areaSqm !== '' && !(Number(body.areaSqm) >= 1 && Number(body.areaSqm) <= 1000000)) errors.areaSqm = 'INVALID_AREA';
  if (body.status !== undefined && !GREENHOUSE_STATUSES.includes(body.status)) errors.status = 'REQUIRED';
  if (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 500)) errors.notes = 'TOO_LONG';
  return errors;
};

const applyEdits = (greenhouse, body) => {
  if (body.name !== undefined) greenhouse.name = body.name.trim();
  if (body.systemType !== undefined) greenhouse.systemType = body.systemType;
  if (body.mainCrop !== undefined) greenhouse.mainCrop = body.mainCrop || undefined;
  if (body.areaSqm !== undefined) greenhouse.areaSqm = body.areaSqm === null || body.areaSqm === '' ? undefined : Number(body.areaSqm);
  if (body.status !== undefined) greenhouse.status = body.status;
  if (body.notes !== undefined) greenhouse.notes = body.notes.trim();
};

// Node count, online count, issue counts and average health per greenhouse
const summarise = (greenhouse, nodes, now) => {
  const own = nodes.filter((node) => String(node.greenhouse) === String(greenhouse._id));
  const online = own.filter((node) => node.lastSeenAt && now - node.lastSeenAt <= ONLINE_WINDOW_MS);
  const assessments = online.map((node) => assessNode(node.toJSON(), now));
  const issues = assessments.flatMap((assessment) => assessment.issues);
  return {
    nodeCount: own.length,
    onlineCount: online.length,
    criticalCount: issues.filter((issue) => issue.severity === 'critical').length,
    warningCount: issues.filter((issue) => issue.severity === 'warning').length,
    healthScore: assessments.length
      ? Math.round(assessments.reduce((sum, assessment) => sum + assessment.healthScore, 0) / assessments.length)
      : null
  };
};

// Finds a greenhouse the signed-in user may see
const findVisible = (req, id) =>
  mongoose.isValidObjectId(id)
    ? Greenhouse.findOne({ _id: id, ...greenhouseFilterFor(req.user) }).populate('assignedUsers', STAFF_FIELDS)
    : null;

// @route   GET /api/greenhouses/options
// @desc    Districts, system types, statuses, crops and the next code per district
router.get('/options', async (req, res) => {
  try {
    const highest = await Greenhouse.aggregate([
      { $match: { company: req.companyId } },
      { $group: { _id: '$district', number: { $max: '$number' } } }
    ]);
    const nextCodes = Object.fromEntries(DISTRICTS.map((district) => {
      const top = highest.find((row) => row._id === district)?.number || 0;
      return [district, greenhouseCode(district, top + 1)];
    }));
    const plan = PLANS[req.user.company.plan];
    const used = await Greenhouse.countDocuments({ company: req.companyId, archivedAt: null });

    res.json({
      districts: DISTRICTS,
      systemTypes: SYSTEM_TYPES,
      statuses: GREENHOUSE_STATUSES,
      crops: CROP_IDS,
      nextCodes,
      limit: plan.limits.greenhouses,
      used
    });
  } catch (err) {
    serverError(res, 'Greenhouse options error', err);
  }
});

// @route   GET /api/greenhouses
// @desc    Greenhouses the user may see, with sensor and health summaries
router.get('/', async (req, res) => {
  try {
    const greenhouses = await Greenhouse.find(greenhouseFilterFor(req.user))
      .populate('assignedUsers', STAFF_FIELDS)
      .sort({ district: 1, number: 1 });
    const nodes = await SensorNode.find({ company: req.companyId, greenhouse: { $in: greenhouses.map((g) => g._id) } });
    const now = new Date();
    res.json(greenhouses.map((greenhouse) => ({ ...greenhouse.toJSON(), summary: summarise(greenhouse, nodes, now) })));
  } catch (err) {
    serverError(res, 'List greenhouses error', err);
  }
});

// @route   POST /api/greenhouses
// @desc    Add a greenhouse; its code (e.g. "Nuwara Eliya GH-01") is assigned automatically
// @access  Company admins
router.post('/', requireRole('admin'), async (req, res) => {
  const errors = validate(req.body, true);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields', errors });
  }

  try {
    const limit = PLANS[req.user.company.plan].limits.greenhouses;
    if (limit !== null && (await Greenhouse.countDocuments({ company: req.companyId, archivedAt: null })) >= limit) {
      return res.status(403).json({ code: 'PLAN_LIMIT_GREENHOUSES', message: `The ${req.user.company.plan} plan allows ${limit} greenhouses` });
    }

    // Next number in the district (archived ones included, so codes are never
    // reused); retry if two admins add one at the same moment
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const top = await Greenhouse.findOne({ company: req.companyId, district: req.body.district }).sort({ number: -1 }).select('number');
      const greenhouse = new Greenhouse({ company: req.companyId, district: req.body.district, number: (top?.number || 0) + 1 });
      applyEdits(greenhouse, req.body);
      try {
        await greenhouse.save();
        return res.status(201).json({ ...greenhouse.toJSON(), summary: summarise(greenhouse, [], new Date()) });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }
    res.status(409).json({ code: 'TRY_AGAIN', message: 'Please try again' });
  } catch (err) {
    serverError(res, 'Create greenhouse error', err);
  }
});

// @route   GET /api/greenhouses/:id
// @desc    One greenhouse with its staff and sensor nodes (with advice)
router.get('/:id', async (req, res) => {
  try {
    const greenhouse = await findVisible(req, req.params.id);
    if (!greenhouse) return notFound(res);

    const nodes = await SensorNode.find({ company: req.companyId, greenhouse: greenhouse._id }).sort({ nodeId: 1 });
    const now = new Date();
    res.json({
      ...greenhouse.toJSON(),
      summary: summarise(greenhouse, nodes, now),
      nodes: nodes.map((node) => ({
        ...node.toJSON(),
        online: Boolean(node.lastSeenAt) && now - node.lastSeenAt <= ONLINE_WINDOW_MS,
        assessment: assessNode(node.toJSON(), now)
      }))
    });
  } catch (err) {
    serverError(res, 'Greenhouse detail error', err);
  }
});

// @route   PATCH /api/greenhouses/:id
// @desc    Edit name, system, main crop, area, status or notes
// @access  Company admins, and farm managers assigned to the greenhouse
router.patch('/:id', requireRole('admin', 'farm_manager'), async (req, res) => {
  const errors = validate(req.body, false);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields', errors });
  }

  try {
    const greenhouse = await findVisible(req, req.params.id);
    if (!greenhouse) return notFound(res);

    applyEdits(greenhouse, req.body);
    await greenhouse.save();
    res.json(greenhouse);
  } catch (err) {
    serverError(res, 'Update greenhouse error', err);
  }
});

// @route   PUT /api/greenhouses/:id/staff
// @desc    Replace the farm managers and field officers assigned to a greenhouse
// @access  Company admins
router.put('/:id/staff', requireRole('admin'), async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds) || !userIds.every((id) => mongoose.isValidObjectId(id))) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'userIds must be a list of user ids' });
  }

  try {
    const greenhouse = await findVisible(req, req.params.id);
    if (!greenhouse) return notFound(res);

    const uniqueIds = [...new Set(userIds.map(String))];
    const staff = await User.find({
      _id: { $in: uniqueIds },
      company: req.companyId,
      status: 'active',
      role: { $in: ASSIGNABLE_ROLES }
    }).select('_id');
    if (staff.length !== uniqueIds.length) {
      return res.status(400).json({ code: 'INVALID_STAFF', message: 'Only active farm managers and field officers of this company can be assigned' });
    }

    greenhouse.assignedUsers = staff.map((user) => user._id);
    await greenhouse.save();
    await greenhouse.populate('assignedUsers', STAFF_FIELDS);
    res.json(greenhouse);
  } catch (err) {
    serverError(res, 'Assign staff error', err);
  }
});

// @route   DELETE /api/greenhouses/:id
// @desc    Archive a greenhouse that has no sensor nodes. It disappears from
//          lists and frees a plan slot, but its code is never reused.
// @access  Company admins
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const greenhouse = await findVisible(req, req.params.id);
    if (!greenhouse) return notFound(res);

    if (await SensorNode.exists({ company: req.companyId, greenhouse: greenhouse._id })) {
      return res.status(409).json({ code: 'GREENHOUSE_HAS_NODES', message: 'Move or remove its sensor nodes first' });
    }
    greenhouse.archivedAt = new Date();
    greenhouse.assignedUsers = [];
    await greenhouse.save();
    res.json({ archived: true });
  } catch (err) {
    serverError(res, 'Archive greenhouse error', err);
  }
});

module.exports = router;
