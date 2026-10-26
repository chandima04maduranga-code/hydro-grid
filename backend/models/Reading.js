const mongoose = require('mongoose');
const { METRIC_IDS } = require('../config/metrics');

const RETENTION_DAYS = 90;

// One sensor value at one moment, kept for history charts
const ReadingSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  nodeId: { type: String, required: true },
  metric: { type: String, enum: METRIC_IDS, required: true },
  value: { type: Number, required: true },
  recordedAt: { type: Date, required: true, default: Date.now }
}, { versionKey: false });

ReadingSchema.index({ company: 1, nodeId: 1, metric: 1, recordedAt: -1 });
// Old readings are removed automatically by MongoDB
ReadingSchema.index({ recordedAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

module.exports = mongoose.model('Reading', ReadingSchema);
module.exports.RETENTION_DAYS = RETENTION_DAYS;
