const requireAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "Admin" || req.user.role === "Instructor")
  ) {
    next(); // User is an admin or instructor, so continue
  } else {
    res.status(403).json({ error: "Access denied" }); // User is not an admin
  }
};

module.exports = requireAdmin;
