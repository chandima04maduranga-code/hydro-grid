const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const auth = require('../middleware/auth');
const { COMPANY_FIELDS } = require('../middleware/auth');
const {
  isNonEmptyString,
  isValidEmail,
  isValidLkMobile,
  normaliseLkMobile,
  isStrongPassword
} = require('../utils/validators');

const router = express.Router();

const TOKEN_TTL = '8h';
const BCRYPT_ROUNDS = 12;

// Login picker value for platform administrators (who belong to no company)
const PLATFORM_LOGIN = 'platform';

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, company: user.company?._id?.toString() },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );

const invalidCredentials = (res, status = 401) =>
  res.status(status).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid company, email or password' });

const validationError = (res, errors) =>
  res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields', errors });

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

// @route   POST /api/auth/register
// @desc    Request an account in a company. It stays pending until that
//          company's admin approves it.
// @access  Public
router.post('/register', async (req, res) => {
  const { companyId, name, email, phone, password, preferredLanguage } = req.body;

  const errors = {};
  if (!mongoose.isValidObjectId(companyId)) errors.company = 'REQUIRED';
  if (!isNonEmptyString(name)) errors.name = 'REQUIRED';
  if (!isValidEmail(email)) errors.email = 'INVALID_EMAIL';
  if (phone && !isValidLkMobile(phone)) errors.phone = 'INVALID_PHONE';
  if (!isStrongPassword(password)) errors.password = 'WEAK_PASSWORD';
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  try {
    const company = await Company.findOne({ _id: companyId, status: 'active' });
    if (!company) {
      return res.status(400).json({ code: 'COMPANY_NOT_FOUND', message: 'Choose an active company', errors: { company: 'REQUIRED' } });
    }

    const normalisedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalisedEmail })) {
      return res.status(409).json({ code: 'EMAIL_TAKEN', message: 'An account with this email already exists' });
    }

    // Role and status are never taken from the request: new accounts are
    // always pending field officers until their company admin reviews them.
    const user = await User.create({
      company: company._id,
      name: name.trim(),
      email: normalisedEmail,
      phone: phone ? normaliseLkMobile(phone) : '',
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      preferredLanguage: User.LANGUAGES.includes(preferredLanguage) ? preferredLanguage : 'en'
    });

    res.status(201).json({
      code: 'REGISTERED_PENDING',
      message: 'Registration received. An administrator will review your account.',
      user
    });
  } catch (err) {
    serverError(res, 'Register error', err);
  }
});

// @route   POST /api/auth/login
// @desc    Log in to a company (or to the platform) and receive a JWT
// @access  Public
router.post('/login', async (req, res) => {
  const { companyId, email, password } = req.body;

  const validCompany = companyId === PLATFORM_LOGIN || mongoose.isValidObjectId(companyId);
  if (!validCompany || !isValidEmail(email) || !isNonEmptyString(password)) {
    return invalidCredentials(res, 400);
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select('+password')
      .populate('company', COMPANY_FIELDS);

    // Same response for unknown email, wrong password or wrong company,
    // so accounts and company memberships can't be discovered
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return invalidCredentials(res);
    }
    const belongsToChoice = companyId === PLATFORM_LOGIN
      ? user.role === 'platform_admin'
      : String(user.company?._id) === String(companyId);
    if (!belongsToChoice) {
      return invalidCredentials(res);
    }

    if (user.role !== 'platform_admin' && user.company.status !== 'active') {
      return res.status(403).json({
        code: `COMPANY_${user.company.status.toUpperCase()}`,
        message: `This company is ${user.company.status}`
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        code: `ACCOUNT_${user.status.toUpperCase()}`,
        message: `Your account is ${user.status}`
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ token: signToken(user), user });
  } catch (err) {
    serverError(res, 'Login error', err);
  }
});

// @route   GET /api/auth/me
// @desc    Get the logged-in user's profile
// @access  Private
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// @route   PATCH /api/auth/me
// @desc    Update own name, phone or preferred language
// @access  Private
router.patch('/me', auth, async (req, res) => {
  const { name, phone, preferredLanguage } = req.body;

  const errors = {};
  if (name !== undefined && !isNonEmptyString(name)) errors.name = 'REQUIRED';
  if (phone && !isValidLkMobile(phone)) errors.phone = 'INVALID_PHONE';
  if (preferredLanguage !== undefined && !User.LANGUAGES.includes(preferredLanguage)) {
    errors.preferredLanguage = 'INVALID_LANGUAGE';
  }
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  try {
    if (name !== undefined) req.user.name = name.trim();
    if (phone !== undefined) req.user.phone = phone ? normaliseLkMobile(phone) : '';
    if (preferredLanguage !== undefined) req.user.preferredLanguage = preferredLanguage;

    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    serverError(res, 'Profile update error', err);
  }
});

module.exports = router;
