const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next(); // User is an admin, so continue
  } else {
    res.status(403).json({ error: "Access denied" }); // User is not an admin
  }
};

module.exports = requireAdmin;
