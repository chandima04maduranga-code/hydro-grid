const mongoose = require('mongoose');
const { CROP_IDS, DEFAULT_CROP } = require('../config/crops');

const LatestReadingSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  recordedAt: { type: Date, required: true }
}, { _id: false });

// A physical IoT box in a greenhouse that reports several metrics at once
const SensorNodeSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  nodeId: { type: String, required: true, trim: true, maxlength: 40 },
  name: { type: String, trim: true, maxlength: 80 },
  // Greenhouse the node is installed in (unset until an admin places it)
  greenhouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Greenhouse', default: null },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  cropProfile: { type: String, enum: CROP_IDS, default: DEFAULT_CROP },
  // Latest value per metric, e.g. latest.ph = { value: 6.1, recordedAt }
  latest: { type: Map, of: LatestReadingSchema, default: {} },
  lastSeenAt: { type: Date }
}, { timestamps: true });

SensorNodeSchema.index({ company: 1, nodeId: 1 }, { unique: true });
SensorNodeSchema.index({ company: 1, greenhouse: 1 });

SensorNodeSchema.set('toJSON', { flattenMaps: true, versionKey: false });

module.exports = mongoose.model('SensorNode', SensorNodeSchema);
