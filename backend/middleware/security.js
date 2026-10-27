const { rateLimit } = require('express-rate-limit');

// Removes keys that start with "$" or contain "." from request bodies, so a
// value like { "email": { "$ne": null } } can't turn into a MongoDB operator
const stripOperators = (value) => {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
      .map(([key, inner]) => [key, stripOperators(inner)])
  );
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = stripOperators(req.body);
  next();
};

const limiter = (windowMinutes, limit, code, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ code, message })
  });

// Slows down password guessing on the login form
const loginLimiter = limiter(15, 10, 'TOO_MANY_ATTEMPTS', 'Too many login attempts, please wait 15 minutes');
// Stops scripts from flooding the sign-up forms
const registerLimiter = limiter(60, 10, 'TOO_MANY_ATTEMPTS', 'Too many sign-up attempts, please try again later');
// General ceiling for every API call from one address
const apiLimiter = limiter(1, 300, 'TOO_MANY_REQUESTS', 'Too many requests, please slow down');

module.exports = { sanitizeBody, stripOperators, loginLimiter, registerLimiter, apiLimiter };
