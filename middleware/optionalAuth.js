const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Optional authentication middleware - sets req.user if token is valid, but doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  
  if (!authorization) {
    // No token provided, continue without setting req.user
    return next();
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const { _id } = jwt.verify(token, process.env.SECRET);
    const user = await User.findOne({ _id }).select("_id role");

    if (user) {
      // Set the user object in the request if token is valid
      req.user = user;
    }
    // If user not found, just continue without setting req.user
  } catch (error) {
    // Invalid token, continue without setting req.user
    // Don't throw error, just proceed
  }
  
  next();
};

module.exports = optionalAuth;

