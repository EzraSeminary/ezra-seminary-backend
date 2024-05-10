const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const { _id } = jwt.verify(token, process.env.SECRET);
    const user = await User.findOne({ _id }).select("_id role");

    if (!user) {
      return res.status(401).json({ error: "Authorization token is invalid" });
    }

    // Set the user object in the request
    req.user = user;

    // Allow access based on the user's role
    if (user.role === "Admin") {
      // Admin has full access
      next();
    } else if (user.role === "Learner") {
      // Learner can access their own profile or any other route
      if (req.params.id && req.params.id !== user._id.toString()) {
        // Learner is trying to update another Learner's profile
        return res.status(403).json({ error: "Forbidden" });
      } else {
        // Learner is updating their own profile or accessing any other route
        next();
      }
    } else {
      return res.status(403).json({ error: "Invalid role" });
    }
  } catch (error) {
    return res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = requireAuth;
