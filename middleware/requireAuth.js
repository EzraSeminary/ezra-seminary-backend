const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  //verify user is authenticated
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

    // Check if the user is an admin
    if (user.role === "Admin") {
      req.user = user;
      next();
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = requireAuth;
