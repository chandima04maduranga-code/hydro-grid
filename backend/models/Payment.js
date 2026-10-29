const mongoose = require('mongoose');
const { PLAN_IDS, BILLING_CYCLES } = require('../config/plans');

const STATUSES = ['pending', 'paid', 'failed', 'cancelled', 'chargedback'];

const PaymentSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Sent to PayHere as order_id
  orderId: { type: String, required: true, unique: true },
  plan: { type: String, enum: PLAN_IDS, required: true },
  billingCycle: { type: String, enum: BILLING_CYCLES, required: true },
  amountLkr: { type: Number, required: true, min: 0 },
  status: { type: String, enum: STATUSES, default: 'pending' },
  payherePaymentId: { type: String, default: '' },
  method: { type: String, default: '' },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

PaymentSchema.set('toJSON', { versionKey: false });
PaymentSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Payment', PaymentSchema);
