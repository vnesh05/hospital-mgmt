function requireAuth(req, res, next) {
  if (req.user) return next();
  return res.redirect("/login");
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).send("Forbidden: Insufficient permissions.");
  };
}

module.exports = { requireAuth, requireRole };