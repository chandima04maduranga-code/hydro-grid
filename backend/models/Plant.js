const mongoose = require('mongoose');
const { CROP_TYPES, GROWTH_STAGES, HEALTH_STATUSES, MAX_PLANT_COUNT } = require('../config/plants');

// A crop growing in one of the company's greenhouses (one row or batch)
const plantSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  // Greenhouse the crop grows in; staff only see crops of their greenhouses
  greenhouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Greenhouse', default: null, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  species: { type: String, required: true, trim: true, maxlength: 120 },
  cropType: { type: String, enum: CROP_TYPES, required: true },
  growthStage: { type: String, enum: GROWTH_STAGES, required: true },
  healthStatus: { type: String, enum: HEALTH_STATUSES, default: 'healthy' },
  // Sensor node watching this crop (SensorNode.nodeId), optional
  systemId: { type: String, trim: true, default: '' },
  plantCount: { type: Number, min: 1, max: MAX_PLANT_COUNT, default: null },
  plantedOn: { type: Date, default: null },
  expectedHarvestOn: { type: Date, default: null },
  image: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

plantSchema.index({ company: 1, name: 1 });
plantSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model('Plant', plantSchema);
