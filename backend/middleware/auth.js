const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer token and loads the current user.
// Users who are no longer active are rejected even if their token is still valid.
module.exports = async function auth(req, res, next) {
  const header = req.header('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ code: 'NO_TOKEN', message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Session expired, please log in again' });
  }
};
