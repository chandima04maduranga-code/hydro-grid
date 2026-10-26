const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const { PLANS, PLAN_IDS, BILLING_CYCLES, YEARLY_MONTHS_CHARGED } = require('../config/plans');
const { DISTRICTS } = require('../config/districts');
const {
  isNonEmptyString,
  isValidEmail,
  isValidLkMobile,
  normaliseLkMobile,
  isStrongPassword
} = require('../utils/validators');

const router = express.Router();

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

// @route   GET /api/companies/options
// @desc    Plans, billing cycles and districts for the company sign-up form
// @access  Public
router.get('/options', (req, res) => {
  res.json({
    plans: PLAN_IDS.map((id) => PLANS[id]),
    billingCycles: BILLING_CYCLES,
    yearlyMonthsCharged: YEARLY_MONTHS_CHARGED,
    districts: DISTRICTS
  });
});

// @route   GET /api/companies
// @desc    Active companies, for the company picker on login and access requests
// @access  Public
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' }).select('name district').sort({ name: 1 });
    res.json(companies);
  } catch (err) {
    serverError(res, 'List companies error', err);
  }
});

// @route   POST /api/companies/register
// @desc    Register a company with its first administrator.
//          The company stays pending until a platform admin approves it.
// @access  Public
router.post('/register', async (req, res) => {
  const { company = {}, admin = {}, plan, billingCycle = 'monthly' } = req.body;

  const errors = {};
  if (!isNonEmptyString(company.name)) errors.companyName = 'REQUIRED';
  if (!DISTRICTS.includes(company.district)) errors.district = 'REQUIRED';
  if (company.phone && !isValidLkMobile(company.phone)) errors.companyPhone = 'INVALID_PHONE';
  if (!PLAN_IDS.includes(plan)) errors.plan = 'REQUIRED';
  if (!BILLING_CYCLES.includes(billingCycle)) errors.billingCycle = 'REQUIRED';
  if (!isNonEmptyString(admin.name)) errors.name = 'REQUIRED';
  if (!isValidEmail(admin.email)) errors.email = 'INVALID_EMAIL';
  if (admin.phone && !isValidLkMobile(admin.phone)) errors.phone = 'INVALID_PHONE';
  if (!isStrongPassword(admin.password)) errors.password = 'WEAK_PASSWORD';
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields', errors });
  }

  const nameKey = Company.toNameKey(company.name);
  const adminEmail = admin.email.trim().toLowerCase();

  try {
    if (await Company.exists({ nameKey })) {
      return res.status(409).json({ code: 'COMPANY_NAME_TAKEN', message: 'A company with this name is already registered' });
    }
    if (await User.exists({ email: adminEmail })) {
      return res.status(409).json({ code: 'EMAIL_TAKEN', message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(admin.password, 12);
    const session = await mongoose.startSession();
    let created;

    // Create the company and its admin together, or neither
    await session.withTransaction(async () => {
      const [newCompany] = await Company.create([{
        name: company.name.trim(),
        nameKey,
        district: company.district,
        contactEmail: adminEmail,
        contactPhone: company.phone ? normaliseLkMobile(company.phone) : '',
        plan,
        billingCycle: plan === 'trial' ? 'monthly' : billingCycle
      }], { session });

      await User.create([{
        company: newCompany._id,
        name: admin.name.trim(),
        email: adminEmail,
        phone: admin.phone ? normaliseLkMobile(admin.phone) : '',
        password: passwordHash,
        role: 'admin',
        status: 'active',
        preferredLanguage: User.LANGUAGES.includes(admin.preferredLanguage) ? admin.preferredLanguage : 'en'
      }], { session });

      created = newCompany;
    });
    await session.endSession();

    res.status(201).json({
      code: 'COMPANY_REGISTERED_PENDING',
      message: 'Company registered. It will be activated after review.',
      company: created
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ code: 'COMPANY_NAME_TAKEN', message: 'A company with this name is already registered' });
    }
    serverError(res, 'Register company error', err);
  }
});

module.exports = router;
