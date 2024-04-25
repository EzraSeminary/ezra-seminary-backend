// controllers/analyticsController.js

const User = require("../models/User");
const Course = require("../models/Course"); // Assuming you have a Course model

const getAnalytics = async (req, res) => {
  try {
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const totalUsers = await User.countDocuments();
    const newCourses = await Course.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const totalCourses = await Course.countDocuments();
    const accountsReached = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const usersLeft = await User.countDocuments({
      lastLogin: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
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
