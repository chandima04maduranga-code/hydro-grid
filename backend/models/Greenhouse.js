const mongoose = require('mongoose');
const { DISTRICTS } = require('../config/districts');
const { CROP_IDS } = require('../config/crops');
const { SYSTEM_TYPES, GREENHOUSE_STATUSES, greenhouseCode } = require('../config/greenhouses');

const GreenhouseSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  // District and number form the permanent code and never change after creation
  district: { type: String, enum: DISTRICTS, required: true, immutable: true },
  number: { type: Number, required: true, min: 1, immutable: true },
  code: { type: String, required: true, immutable: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  systemType: { type: String, enum: SYSTEM_TYPES, default: 'nft' },
  mainCrop: { type: String, enum: CROP_IDS },
  areaSqm: { type: Number, min: 1, max: 1000000 },
  status: { type: String, enum: GREENHOUSE_STATUSES, default: 'active' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  // Farm managers and field officers who may see and work in this greenhouse
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Removed greenhouses are archived, never deleted, so their code is never reused
  archivedAt: { type: Date, default: null }
}, { timestamps: true });

GreenhouseSchema.index({ company: 1, district: 1, number: 1 }, { unique: true });
GreenhouseSchema.index({ company: 1, assignedUsers: 1 });

GreenhouseSchema.pre('validate', function setCode() {
  if (this.isNew && this.district && this.number) {
    this.code = greenhouseCode(this.district, this.number);
  }
});

GreenhouseSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model('Greenhouse', GreenhouseSchema);
