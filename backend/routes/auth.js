const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
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

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

const validationError = (res, errors) =>
  res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields', errors });

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

// @route   POST /api/auth/register
// @desc    Request an account. It stays pending until an admin approves it.
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, phone, password, preferredLanguage } = req.body;

  const errors = {};
  if (!isNonEmptyString(name)) errors.name = 'REQUIRED';
  if (!isValidEmail(email)) errors.email = 'INVALID_EMAIL';
  if (phone && !isValidLkMobile(phone)) errors.phone = 'INVALID_PHONE';
  if (!isStrongPassword(password)) errors.password = 'WEAK_PASSWORD';
  if (Object.keys(errors).length > 0) return validationError(res, errors);

  try {
    const normalisedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalisedEmail })) {
      return res.status(409).json({ code: 'EMAIL_TAKEN', message: 'An account with this email already exists' });
    }

    // Role and status are never taken from the request: new accounts are
    // always pending field officers until an admin reviews them.
    const user = await User.create({
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
// @desc    Log in and receive a JWT
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    // Same response for unknown email and wrong password, so accounts can't be discovered
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
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
