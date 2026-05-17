const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized: No active session' });
  }
  next();
};

const requireAuthOptional = (req, res, next) => {
  next();
};

module.exports = {
  requireAuth,
  requireAuthOptional,
};