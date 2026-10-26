const User = require('../models/User');
const requireRole = require('./requireRole');

// Company data (crops, sensors, staff) is only for users inside a company.
// Platform admins manage companies, not their day-to-day data.
module.exports = requireRole(...User.COMPANY_ROLES);
