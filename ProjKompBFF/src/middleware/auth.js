const sessionMiddleware = (req, res, next) => {
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized: No active session' });
  }
  next();
};

const requireAuthOptional = (req, res, next) => {
  // Allows requests to continue even without auth; caller decides based on req.session.user
  next();
};

module.exports = {
  sessionMiddleware,
  requireAuth,
  requireAuthOptional,
};
