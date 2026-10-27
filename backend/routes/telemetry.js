const express = require('express');
const mongoose = require('mongoose');
const Company = require('../models/Company');
const Greenhouse = require('../models/Greenhouse');
const SensorNode = require('../models/SensorNode');
const Reading = require('../models/Reading');
const auth = require('../middleware/auth');
const requireCompanyUser = require('../middleware/requireCompanyUser');
const requireRole = require('../middleware/requireRole');
const { METRICS, METRIC_IDS } = require('../config/metrics');
const { CROPS, CROP_IDS } = require('../config/crops');
const { PLANS } = require('../config/plans');
const { assessNode, rangesFor } = require('../services/advisor');
const { greenhouseFilterFor, seesAllGreenhouses, visibleGreenhouseIds } = require('../services/access');
const { DEVICE_KEY_HEADER, hashDeviceKey } = require('../utils/deviceKeys');

const router = express.Router();

const GREENHOUSE_FIELDS = 'code name district number';

// Nodes the user may see: admins see all (optionally one greenhouse or the
// unplaced ones); other staff only nodes in their assigned greenhouses
const nodeFilterFor = async (req, greenhouseParam) => {
  const filter = { company: req.companyId };
  const visible = await visibleGreenhouseIds(req.user);

  if (greenhouseParam === 'none') {
    filter.greenhouse = visible === null ? null : { $in: [] };
  } else if (greenhouseParam) {
    const allowed = mongoose.isValidObjectId(greenhouseParam)
      && (visible === null || visible.some((id) => String(id) === String(greenhouseParam)));
    filter.greenhouse = allowed ? greenhouseParam : { $in: [] };
  } else if (visible !== null) {
    filter.greenhouse = { $in: visible };
  }
  return filter;
};

const NODE_ID_PATTERN = /^[A-Za-z0-9_-]{2,40}$/;
// A node that has not reported for this long is shown as offline
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const MAX_HISTORY_HOURS = 168;

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

const withAssessment = (node, now = new Date()) => {
  const json = node.toJSON();
  return {
    ...json,
    online: Boolean(node.lastSeenAt) && now - node.lastSeenAt <= ONLINE_WINDOW_MS,
    assessment: assessNode(json, now)
  };
};

// @route   POST /api/telemetry
// @desc    Ingest a batch of readings from one node:
//          { nodeId, location?, readings: { ph: 6.1, ec: 1.2, ... } }
//          The company is found from the X-Device-Key header.
// @access  Devices with a valid device key
router.post('/', async (req, res) => {
  const { nodeId, location, readings } = req.body;
  const deviceKey = req.get(DEVICE_KEY_HEADER);

  if (typeof deviceKey !== 'string' || deviceKey.length < 20 || deviceKey.length > 100) {
    return res.status(401).json({ code: 'DEVICE_KEY_REQUIRED', message: `Send the company device key in the ${DEVICE_KEY_HEADER} header` });
  }
  if (typeof nodeId !== 'string' || !NODE_ID_PATTERN.test(nodeId)) {
    return res.status(400).json({ code: 'INVALID_NODE_ID', message: 'nodeId must be 2-40 letters, digits, _ or -' });
  }

  const accepted = Object.entries(readings && typeof readings === 'object' ? readings : {})
    .filter(([metric, value]) => METRICS[metric] && Number.isFinite(value));
  if (accepted.length === 0) {
    return res.status(400).json({ code: 'NO_READINGS', message: `Send at least one of: ${METRIC_IDS.join(', ')}` });
  }

  try {
    const company = await Company.findOne({ deviceKeyHash: hashDeviceKey(deviceKey), status: 'active' }).select('plan');
    if (!company) {
      return res.status(401).json({ code: 'INVALID_DEVICE_KEY', message: 'Unknown device key or inactive company' });
    }

    // New nodes count against the plan's sensor node limit
    const exists = await SensorNode.exists({ company: company._id, nodeId });
    const limit = PLANS[company.plan].limits.sensorNodes;
    if (!exists && limit !== null && (await SensorNode.countDocuments({ company: company._id })) >= limit) {
      return res.status(403).json({ code: 'PLAN_LIMIT_NODES', message: `The ${company.plan} plan allows ${limit} sensor nodes` });
    }

    const now = new Date();
    const latest = Object.fromEntries(accepted.map(([metric, value]) => [`latest.${metric}`, { value, recordedAt: now }]));
    await SensorNode.updateOne(
      { company: company._id, nodeId },
      {
        $set: { ...latest, lastSeenAt: now },
        $setOnInsert: { name: nodeId, location: typeof location === 'string' ? location.slice(0, 120) : '' }
      },
      { upsert: true }
    );
    await Reading.insertMany(accepted.map(([metric, value]) => ({ company: company._id, nodeId, metric, value, recordedAt: now })));

    res.status(202).json({
      received: accepted.length,
      ignored: Object.keys(readings).filter((metric) => !accepted.some(([accept]) => accept === metric))
    });
  } catch (err) {
    serverError(res, 'Telemetry ingest error', err);
  }
});

// Everything below is for signed-in company users
router.use(auth, requireCompanyUser);

// @route   GET /api/telemetry/options
// @desc    Metric catalogue and crop profiles with their target bands
router.get('/options', (req, res) => {
  res.json({
    metrics: Object.fromEntries(METRIC_IDS.map((id) => [id, { unit: METRICS[id].unit, group: METRICS[id].group }])),
    crops: CROP_IDS.map((id) => ({
      id,
      ranges: Object.fromEntries(Object.keys(CROPS[id]).map((metric) => [metric, rangesFor(metric, id)]))
    }))
  });
});

// @route   GET /api/telemetry/nodes?greenhouse=<id>|none
// @desc    Visible nodes with latest readings, online state and advice
router.get('/nodes', async (req, res) => {
  try {
    const filter = await nodeFilterFor(req, req.query.greenhouse);
    const nodes = await SensorNode.find(filter).populate('greenhouse', GREENHOUSE_FIELDS).sort({ nodeId: 1 });
    const now = new Date();
    res.json(nodes.map((node) => withAssessment(node, now)));
  } catch (err) {
    serverError(res, 'List nodes error', err);
  }
});

// @route   GET /api/telemetry/nodes/:nodeId/history?hours=24
// @desc    Averaged readings per metric for charts
router.get('/nodes/:nodeId/history', async (req, res) => {
  const hours = Math.min(Math.max(Number.parseInt(req.query.hours, 10) || 24, 1), MAX_HISTORY_HOURS);
  // Fewer, wider buckets for longer periods keeps charts light
  const binMinutes = hours <= 6 ? 5 : hours <= 24 ? 15 : 60;

  try {
    const node = await SensorNode.findOne({ ...(await nodeFilterFor(req)), nodeId: req.params.nodeId });
    if (!node) return res.status(404).json({ code: 'NODE_NOT_FOUND', message: 'Sensor node not found' });

    const rows = await Reading.aggregate([
      { $match: { company: req.companyId, nodeId: node.nodeId, recordedAt: { $gte: new Date(Date.now() - hours * 3600 * 1000) } } },
      {
        $group: {
          _id: { metric: '$metric', at: { $dateTrunc: { date: '$recordedAt', unit: 'minute', binSize: binMinutes } } },
          value: { $avg: '$value' }
        }
      },
      { $sort: { '_id.at': 1 } }
    ]);

    const series = {};
    for (const row of rows) {
      (series[row._id.metric] ||= []).push({ at: row._id.at, value: Math.round(row.value * 100) / 100 });
    }
    res.json({ nodeId: node.nodeId, hours, binMinutes, series });
  } catch (err) {
    serverError(res, 'Node history error', err);
  }
});

// @route   PATCH /api/telemetry/nodes/:nodeId
// @desc    Rename a node, set its location, crop profile or greenhouse (null = unplaced)
// @access  Company admins and farm managers (managers only within their greenhouses)
router.patch('/nodes/:nodeId', requireRole('admin', 'farm_manager'), async (req, res) => {
  const { name, location, cropProfile, greenhouse } = req.body;
  const errors = {};
  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 80)) errors.name = 'REQUIRED';
  if (location !== undefined && (typeof location !== 'string' || location.length > 120)) errors.location = 'REQUIRED';
  if (cropProfile !== undefined && !CROP_IDS.includes(cropProfile)) errors.cropProfile = 'REQUIRED';
  if (greenhouse !== undefined && greenhouse !== null && !mongoose.isValidObjectId(greenhouse)) errors.greenhouse = 'REQUIRED';
  if (greenhouse === null && !seesAllGreenhouses(req.user)) errors.greenhouse = 'REQUIRED';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields', errors });
  }

  try {
    const node = await SensorNode.findOne({ ...(await nodeFilterFor(req)), nodeId: req.params.nodeId });
    if (!node) return res.status(404).json({ code: 'NODE_NOT_FOUND', message: 'Sensor node not found' });

    if (greenhouse) {
      const target = await Greenhouse.exists({ _id: greenhouse, ...greenhouseFilterFor(req.user) });
      if (!target) return res.status(404).json({ code: 'GREENHOUSE_NOT_FOUND', message: 'Greenhouse not found' });
    }

    if (name !== undefined) node.name = name.trim();
    if (location !== undefined) node.location = location.trim();
    if (cropProfile !== undefined) node.cropProfile = cropProfile;
    if (greenhouse !== undefined) node.greenhouse = greenhouse;
    await node.save();
    await node.populate('greenhouse', GREENHOUSE_FIELDS);
    res.json(withAssessment(node));
  } catch (err) {
    serverError(res, 'Update node error', err);
  }
});

module.exports = router;
