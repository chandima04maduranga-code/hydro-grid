const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COMPANY_FIELDS = 'name district status plan billingCycle trialEndsAt';

// Verifies the Bearer token and loads the current user with their company.
// Users who are no longer active, or whose company is no longer active, are
// rejected even if their token is still valid.
module.exports = async function auth(req, res, next) {
  const header = req.header('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ code: 'NO_TOKEN', message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).populate('company', COMPANY_FIELDS);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
    }
    if (user.role !== 'platform_admin' && user.company?.status !== 'active') {
      return res.status(401).json({ code: 'COMPANY_INACTIVE', message: 'Company is not active' });
    }

    req.user = user;
    // Every company-scoped query filters on this id
    req.companyId = user.company?._id;
    next();
  } catch (err) {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Session expired, please log in again' });
  }
};

module.exports.COMPANY_FIELDS = COMPANY_FIELDS;
