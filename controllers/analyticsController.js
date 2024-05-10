const User = require("../models/User");
const Course = require("../models/Course");
const Analytics = require("../models/Analytics");

const getAnalytics = async () => {
  try {
    // Get the current analytics data
    let analyticsData = await Analytics.findOne();

    if (!analyticsData) {
      // If no analytics data exists, create a new one
      analyticsData = new Analytics({
        newUsers: 0,
        totalUsers: 0,
        newCourses: 0,
        totalCourses: 0,
        accountsReached: 0,
        usersLeft: 0,
      });
    }

    const newUsersCount = await User.countDocuments({
      createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });

    // Update the analytics data
    analyticsData.newUsers = newUsersCount;
    analyticsData.newCourses = await Course.countDocuments({
      createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    analyticsData.totalUsers = await User.countDocuments();
    analyticsData.totalCourses = await Course.countDocuments();
    analyticsData.accountsReached = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    analyticsData.usersLeft = await User.countDocuments({
      $or: [
        { lastLogin: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } },
        { deletedAt: { $ne: null } },
      ],
    });

    await analyticsData.save();

    return analyticsData;
  } catch (error) {
    console.error(error);
    throw new Error("Internal server error");
  }
};

module.exports = {
  getAnalytics,
};
