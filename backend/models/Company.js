const mongoose = require('mongoose');
const { PLAN_IDS, BILLING_CYCLES } = require('../config/plans');
const { DISTRICTS } = require('../config/districts');

const STATUSES = ['pending', 'active', 'rejected', 'suspended'];

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  // Lower-cased name, used to block duplicate company names
  nameKey: { type: String, required: true, unique: true },
  district: { type: String, enum: DISTRICTS, required: true },
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  contactPhone: { type: String, trim: true, default: '' },
  status: { type: String, enum: STATUSES, default: 'pending' },
  plan: { type: String, enum: PLAN_IDS, default: 'trial' },
  billingCycle: { type: String, enum: BILLING_CYCLES, default: 'monthly' },
  trialEndsAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

CompanySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.nameKey;
    delete ret.__v;
    return ret;
  }
});

CompanySchema.statics.STATUSES = STATUSES;
CompanySchema.statics.toNameKey = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');

module.exports = mongoose.model('Company', CompanySchema);
