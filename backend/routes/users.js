const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Every route in this file is for company admins, and only ever touches
// users of the admin's own company
router.use(auth, requireRole('admin'));

const serverError = (res, context, err) => {
  console.error(`${context}:`, err.message);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong, please try again' });
};

// Loads the target user and blocks admins from changing their own account
const loadTargetUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
    return null;
  }
  if (req.params.id === req.user.id) {
    res.status(400).json({ code: 'CANNOT_CHANGE_SELF', message: 'You cannot change your own role or status' });
    return null;
  }
  // Scoping by company means another company's user is simply "not found"
  const user = await User.findOne({ _id: req.params.id, company: req.companyId });
  if (!user) {
    res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
    return null;
  }
  return user;
};

const markReviewed = (user, admin) => {
  user.reviewedBy = admin._id;
  user.reviewedAt = new Date();
};

// @route   GET /api/users?status=pending
// @desc    List the company's users, optionally filtered by status
// @access  Admin
router.get('/', async (req, res) => {
  const filter = { company: req.companyId };
  if (req.query.status) {
    if (!User.STATUSES.includes(req.query.status)) {
      return res.status(400).json({ code: 'INVALID_STATUS', message: 'Unknown status filter' });
    }
    filter.status = req.query.status;
  }

  try {
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    serverError(res, 'List users error', err);
  }
});

// @route   PATCH /api/users/:id/approve
// @desc    Approve a pending account and assign its role
// @access  Admin
router.patch('/:id/approve', async (req, res) => {
  const { role } = req.body;
  if (!User.COMPANY_ROLES.includes(role)) {
    return res.status(400).json({ code: 'INVALID_ROLE', message: 'Choose a valid role' });
  }

  try {
    const user = await loadTargetUser(req, res);
    if (!user) return;
    if (user.status !== 'pending') {
      return res.status(409).json({ code: 'NOT_PENDING', message: 'Only pending accounts can be approved' });
    }

    user.role = role;
    user.status = 'active';
    markReviewed(user, req.user);
    await user.save();
    res.json(user);
  } catch (err) {
    serverError(res, 'Approve user error', err);
  }
});

// @route   PATCH /api/users/:id/reject
// @desc    Reject a pending account
// @access  Admin
router.patch('/:id/reject', async (req, res) => {
  try {
    const user = await loadTargetUser(req, res);
    if (!user) return;
    if (user.status !== 'pending') {
      return res.status(409).json({ code: 'NOT_PENDING', message: 'Only pending accounts can be rejected' });
    }

    user.status = 'rejected';
    markReviewed(user, req.user);
    await user.save();
    res.json(user);
  } catch (err) {
    serverError(res, 'Reject user error', err);
  }
});

// @route   PATCH /api/users/:id
// @desc    Change an approved user's role, or disable / re-enable the account
// @access  Admin
router.patch('/:id', async (req, res) => {
  const { role, status } = req.body;

  if (role !== undefined && !User.COMPANY_ROLES.includes(role)) {
    return res.status(400).json({ code: 'INVALID_ROLE', message: 'Choose a valid role' });
  }
  if (status !== undefined && !['active', 'disabled'].includes(status)) {
    return res.status(400).json({ code: 'INVALID_STATUS', message: 'Status must be active or disabled' });
  }

  try {
    const user = await loadTargetUser(req, res);
    if (!user) return;
    if (!['active', 'disabled'].includes(user.status)) {
      return res.status(409).json({ code: 'NOT_REVIEWED', message: 'Approve or reject this account first' });
    }

    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    markReviewed(user, req.user);
    await user.save();
    res.json(user);
  } catch (err) {
    serverError(res, 'Update user error', err);
  }
});

module.exports = router;
