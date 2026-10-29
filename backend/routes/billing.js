const express = require('express');
const crypto = require('crypto');
const Company = require('../models/Company');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { PLANS, BILLING_CYCLES, priceFor } = require('../config/plans');
const payhere = require('../config/payhere');

const router = express.Router();

const CURRENCY = 'LKR';
const PAID_PLANS = Object.keys(PLANS).filter((id) => id !== 'trial');
const DAY_MS = 24 * 60 * 60 * 1000;

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

const extendPaidUntil = (current, billingCycle, now = new Date()) => {
  const start = current && current > now ? new Date(current) : new Date(now);
  if (billingCycle === 'yearly') start.setFullYear(start.getFullYear() + 1);
  else start.setMonth(start.getMonth() + 1);
  return start;
};

// @route   POST /api/billing/payhere/notify
// @desc    PayHere's server-to-server payment notification. The md5sig proves
//          it came from PayHere; only then is the subscription updated.
// @access  PayHere (public URL, form-encoded body)
router.post('/payhere/notify', express.urlencoded({ extended: false, limit: '10kb' }), async (req, res) => {
  const {
    merchant_id: merchantId, order_id: orderId, payment_id: paymentId,
    payhere_amount: amount, payhere_currency: currency, status_code: statusCode, md5sig, method
  } = req.body;

  try {
    const expected = payhere.notifySignature({ merchantId, orderId, amount, currency, statusCode });
    const validSignature = payhere.isConfigured()
      && merchantId === payhere.settings().merchantId
      && typeof md5sig === 'string'
      && md5sig.length === expected.length
      && crypto.timingSafeEqual(Buffer.from(md5sig), Buffer.from(expected));
    if (!validSignature) {
      console.warn(`PayHere notify rejected for order ${orderId}: bad signature`);
      return res.status(400).send('Invalid signature');
    }

    const payment = await Payment.findOne({ orderId });
    const status = payhere.STATUS_CODES[statusCode];
    if (!payment || !status) return res.status(400).send('Unknown order or status');
    if (currency !== CURRENCY || payhere.formatAmount(amount) !== payhere.formatAmount(payment.amountLkr)) {
      console.warn(`PayHere notify rejected for order ${orderId}: amount or currency does not match`);
      return res.status(400).send('Amount mismatch');
    }

    // PayHere may send the same notification more than once
    if (payment.status === 'paid') return res.send('OK');

    payment.status = status;
    payment.payherePaymentId = paymentId || '';
    payment.method = method || '';
    if (status === 'paid') {
      payment.paidAt = new Date();
      const company = await Company.findById(payment.company);
      company.plan = payment.plan;
      company.billingCycle = payment.billingCycle;
      company.paidUntil = extendPaidUntil(company.paidUntil, payment.billingCycle);
      company.trialEndsAt = undefined;
      await company.save();
    }
    await payment.save();
    res.send('OK');
  } catch (err) {
    serverError(res, 'PayHere notify error', err);
  }
});

router.use(auth, requireRole('admin'));

// @route   GET /api/billing
// @desc    Current plan, trial or paid-until date, plan prices and payment history
// @access  Company admins
router.get('/', async (req, res) => {
  try {
    const company = await Company.findById(req.companyId);
    const payments = await Payment.find({ company: req.companyId }).sort({ createdAt: -1 }).limit(50).populate('requestedBy', 'name');
    const now = new Date();
    const trialDaysLeft = company.plan === 'trial' && company.trialEndsAt
      ? Math.max(0, Math.ceil((company.trialEndsAt - now) / DAY_MS))
      : null;

    res.json({
      plan: company.plan,
      billingCycle: company.billingCycle,
      trialEndsAt: company.trialEndsAt || null,
      trialDaysLeft,
      paidUntil: company.paidUntil || null,
      expired: company.plan === 'trial' ? trialDaysLeft === 0 : Boolean(company.paidUntil && company.paidUntil < now),
      payhereReady: payhere.isConfigured(),
      prices: PAID_PLANS.map((id) => ({
        plan: id,
        monthly: priceFor(id, 'monthly'),
        yearly: priceFor(id, 'yearly'),
        limits: PLANS[id].limits
      })),
      payments
    });
  } catch (err) {
    serverError(res, 'Billing summary error', err);
  }
});

// @route   POST /api/billing/checkout
// @desc    Start a PayHere payment: saves a pending payment and returns the
//          signed form fields the browser posts to PayHere
// @access  Company admins
router.post('/checkout', async (req, res) => {
  const { plan, billingCycle } = req.body;
  if (!PAID_PLANS.includes(plan) || !BILLING_CYCLES.includes(billingCycle)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Choose a paid plan and billing cycle', errors: { plan: 'REQUIRED' } });
  }
  if (!payhere.isConfigured()) {
    return res.status(503).json({ code: 'PAYHERE_NOT_CONFIGURED', message: 'Online payments are not set up yet' });
  }

  try {
    const amount = priceFor(plan, billingCycle);
    const orderId = `HG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await Payment.create({ company: req.companyId, requestedBy: req.user._id, orderId, plan, billingCycle, amountLkr: amount });

    const { merchantId, checkoutUrl, notifyUrl, clientUrl } = payhere.settings();
    const [firstName, ...rest] = req.user.name.split(' ');
    res.status(201).json({
      action: checkoutUrl,
      fields: {
        merchant_id: merchantId,
        return_url: `${clientUrl}/billing/return?order=${orderId}`,
        cancel_url: `${clientUrl}/billing?cancelled=${orderId}`,
        notify_url: notifyUrl,
        order_id: orderId,
        items: `Hydro_Grid ${plan} plan (${billingCycle})`,
        currency: CURRENCY,
        amount: payhere.formatAmount(amount),
        first_name: firstName,
        last_name: rest.join(' ') || firstName,
        email: req.user.email,
        phone: req.user.phone || req.user.company.contactPhone || '0770000000',
        address: req.user.company.name,
        city: req.user.company.district,
        country: 'Sri Lanka',
        hash: payhere.checkoutHash({ orderId, amount, currency: CURRENCY })
      }
    });
  } catch (err) {
    serverError(res, 'Checkout error', err);
  }
});

// @route   POST /api/billing/payments/:orderId/cancel
// @desc    Mark a still-pending payment as cancelled (the user left PayHere)
// @access  Company admins
router.post('/payments/:orderId/cancel', async (req, res) => {
  try {
    await Payment.updateOne({ orderId: req.params.orderId, company: req.companyId, status: 'pending' }, { status: 'cancelled' });
    res.status(204).end();
  } catch (err) {
    serverError(res, 'Cancel payment error', err);
  }
});

module.exports = router;
