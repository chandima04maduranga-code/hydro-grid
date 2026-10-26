// Restricts a route to the given roles. Use after the auth middleware.
// Example: router.get('/', auth, requireRole('admin'), handler)
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You do not have permission for this action' });
    }
    next();
  };
};
