const requireAuth = (req, res, next) => {
  console.log('requireAuth check - session user:', !!req.session?.user, 'auth_token cookie:', !!req.cookies?.auth_token);
  if (!req.session?.user || !req.cookies?.auth_token) {
    return res.status(401).json({ error: 'Unauthorized: No active session or missing token' });
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