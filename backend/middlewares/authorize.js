const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user || !permissions.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    next();
  };
};

module.exports = authorize;
