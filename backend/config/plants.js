// Crop record options and validation, shared by the API and the scripts.
// Values are stored as codes; the UI translates them (English / Sinhala).
const mongoose = require('mongoose');

const CROP_TYPES = ['leafyGreen', 'fruitVegetable', 'fruit', 'herb', 'rootVegetable'];
const GROWTH_STAGES = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvestReady'];
const HEALTH_STATUSES = ['healthy', 'nutrientWarning', 'pestRisk', 'critical'];

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  '-name': { name: -1 },
  harvest: { expectedHarvestOn: 1, name: 1 },
  planted: { plantedOn: -1, name: 1 }
};

const NODE_ID_PATTERN = /^[A-Za-z0-9_-]{2,40}$/;
const MAX_PLANT_COUNT = 100000;

const isText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const isOptionalText = (value, max) => value === undefined || value === null || (typeof value === 'string' && value.trim().length <= max);
const toDate = (value) => (value ? new Date(value) : null);
const isValidDate = (value) => value === undefined || value === null || value === '' || !Number.isNaN(new Date(value).getTime());

const isImageUrl = (value) => {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string' || value.length > 500) return false;
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Checks a crop body and returns { errors, values }. With `partial`, only the
// fields that were sent are checked (for PATCH).
const validatePlant = (body, { partial = false } = {}) => {
  const errors = {};
  const values = {};
  const has = (field) => body[field] !== undefined;
  const check = (field, ok, code, value) => {
    if (partial && !has(field)) return;
    if (!ok) errors[field] = code;
    else values[field] = value;
  };

  check('name', isText(body.name, 80), body.name?.trim?.() ? 'TOO_LONG' : 'REQUIRED', body.name?.trim?.());
  check('species', isText(body.species, 120), body.species?.trim?.() ? 'TOO_LONG' : 'REQUIRED', body.species?.trim?.());
  check('cropType', CROP_TYPES.includes(body.cropType), 'REQUIRED', body.cropType);
  check('growthStage', GROWTH_STAGES.includes(body.growthStage), 'REQUIRED', body.growthStage);
  check('healthStatus', HEALTH_STATUSES.includes(body.healthStatus), 'REQUIRED', body.healthStatus);

  if (!partial || has('greenhouse')) {
    if (!mongoose.isValidObjectId(body.greenhouse)) errors.greenhouse = 'REQUIRED';
    else values.greenhouse = body.greenhouse;
  }
  if (has('systemId')) {
    const id = typeof body.systemId === 'string' ? body.systemId.trim() : '';
    if (id && !NODE_ID_PATTERN.test(id)) errors.systemId = 'INVALID_NODE_ID';
    else values.systemId = id;
  }
  if (has('plantCount')) {
    const count = body.plantCount === '' || body.plantCount === null ? null : Number(body.plantCount);
    if (count !== null && !(Number.isInteger(count) && count >= 1 && count <= MAX_PLANT_COUNT)) errors.plantCount = 'INVALID_COUNT';
    else values.plantCount = count;
  }
  for (const field of ['plantedOn', 'expectedHarvestOn']) {
    if (!has(field)) continue;
    if (!isValidDate(body[field])) errors[field] = 'INVALID_DATE';
    else values[field] = toDate(body[field]);
  }
  if (values.plantedOn && values.expectedHarvestOn && values.expectedHarvestOn < values.plantedOn) {
    errors.expectedHarvestOn = 'HARVEST_BEFORE_PLANTING';
  }
  if (has('image')) {
    if (!isImageUrl(body.image)) errors.image = 'INVALID_URL';
    else values.image = body.image ? body.image.trim() : '';
  }
  if (has('notes')) {
    if (!isOptionalText(body.notes, 500)) errors.notes = 'TOO_LONG';
    else values.notes = body.notes ? body.notes.trim() : '';
  }

  return { errors, values };
};

module.exports = { CROP_TYPES, GROWTH_STAGES, HEALTH_STATUSES, SORTS, MAX_PLANT_COUNT, validatePlant };
