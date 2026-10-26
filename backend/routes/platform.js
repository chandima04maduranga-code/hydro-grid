const express = require('express');
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { PLANS, PLAN_IDS } = require('../config/plans');

const router = express.Router();

// Every route in this file is for platform administrators only
router.use(auth, requireRole('platform_admin'));

const DAY_MS = 24 * 60 * 60 * 1000;

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

// Company plus its admin contact and number of staff accounts
const withDetails = async (companies) => {
  const ids = companies.map((company) => company._id);
  const [admins, counts] = await Promise.all([
    User.find({ company: { $in: ids }, role: 'admin' }).select('company name email phone').sort({ createdAt: 1 }),
    User.aggregate([{ $match: { company: { $in: ids } } }, { $group: { _id: '$company', users: { $sum: 1 } } }])
  ]);

  return companies.map((company) => {
    const admin = admins.find((user) => String(user.company) === String(company._id));
    const count = counts.find((row) => String(row._id) === String(company._id));
    return {
      ...company.toJSON(),
      admin: admin ? { name: admin.name, email: admin.email, phone: admin.phone } : null,
      userCount: count ? count.users : 0
    };
  });
};

// Runs a status change on a company if it is currently in one of `from`
const changeStatus = (from, to, extra = () => ({})) => async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
  }

  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
    }
    if (!from.includes(company.status)) {
      return res.status(409).json({ code: 'INVALID_COMPANY_STATUS', message: `Company is ${company.status}` });
    }

    Object.assign(company, { status: to, reviewedBy: req.user._id, reviewedAt: new Date() }, extra(company));
    await company.save();
    const [detailed] = await withDetails([company]);
    res.json(detailed);
  } catch (err) {
    serverError(res, `Company ${to} error`, err);
  }
};

// @route   GET /api/platform/summary
// @desc    Platform totals: companies by status and plan, and user count
router.get('/summary', async (req, res) => {
  try {
    const [byStatus, byPlan, users] = await Promise.all([
      Company.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Company.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$plan', count: { $sum: 1 } } }]),
      User.countDocuments({ role: { $ne: 'platform_admin' } })
    ]);

    const toMap = (rows, keys) => Object.fromEntries(keys.map((key) => [key, rows.find((row) => row._id === key)?.count || 0]));
    res.json({
      companies: toMap(byStatus, Company.STATUSES),
      activePlans: toMap(byPlan, PLAN_IDS),
      users
    });
  } catch (err) {
    serverError(res, 'Platform summary error', err);
  }
});

// @route   GET /api/platform/companies?status=pending
// @desc    List companies, optionally by status, newest first
router.get('/companies', async (req, res) => {
  const filter = {};
  if (req.query.status) {
    if (!Company.STATUSES.includes(req.query.status)) {
      return res.status(400).json({ code: 'INVALID_STATUS', message: 'Unknown status filter' });
    }
    filter.status = req.query.status;
  }

  try {
    const companies = await Company.find(filter).sort({ createdAt: -1 });
    res.json(await withDetails(companies));
  } catch (err) {
    serverError(res, 'List companies error', err);
  }
});

// @route   PATCH /api/platform/companies/:id/approve
// @desc    Activate a pending company; a trial starts counting from approval
router.patch('/companies/:id/approve', changeStatus(['pending'], 'active', (company) => (
  company.plan === 'trial'
    ? { trialEndsAt: new Date(Date.now() + PLANS.trial.trialDays * DAY_MS) }
    : {}
)));

// @route   PATCH /api/platform/companies/:id/reject
router.patch('/companies/:id/reject', changeStatus(['pending'], 'rejected'));

// @route   PATCH /api/platform/companies/:id/suspend
// @desc    Block a company's users from logging in (e.g. unpaid subscription)
router.patch('/companies/:id/suspend', changeStatus(['active'], 'suspended'));

// @route   PATCH /api/platform/companies/:id/reactivate
router.patch('/companies/:id/reactivate', changeStatus(['suspended'], 'active'));

module.exports = router;
