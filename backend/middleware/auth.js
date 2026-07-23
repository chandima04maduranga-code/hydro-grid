const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from the header
  const token = req.header('x-auth-token');

  // Check if no token exists
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};