// controllers/analyticsController.js
const User = require("../models/User");
const Course = require("../models/Course");
const getAnalytics = async (req, res) => {
  try {
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Count users created in the last 30 days
    });
    const totalUsers = await User.countDocuments();
    const newCourses = await Course.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Count courses created in the last 30 days
    });
    const totalCourses = await Course.countDocuments();
    const accountsReached = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const usersLeft = await User.countDocuments({
      lastLogin: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // Count users who haven't logged in for the last 2 months
    });

    const analyticsData = {
      newUsers,
      totalUsers,
      newCourses,
      totalCourses,
      accountsReached,
      usersLeft,
    };

    res.json(analyticsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAnalytics,
};
