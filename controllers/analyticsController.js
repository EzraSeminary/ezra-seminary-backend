const User = require("../models/User");
const Course = require("../models/Course");
const Devotion = require("../models/Devotion");
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
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        averageSessionTime: 0,
        courseCompletionRate: 0,
        userEngagementRate: 0,
        totalDevotions: 0,
        newDevotions: 0,
      });
    }

    // Count only active users (not deleted)
    const activeUsersCount = await User.countDocuments({
      deletedAt: null,
    });

    // Count new users in the last 30 days (only active users)
    const newUsersCount = await User.countDocuments({
      createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });

    // Count users who left (inactive for 60+ days or deleted)
    const usersLeftCount = await User.countDocuments({
      $or: [
        // Users who haven't logged in for 60+ days (and are not deleted)
        {
          lastLogin: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
        // Users who have been soft-deleted
        { deletedAt: { $ne: null } },
      ],
    });

    // Count accounts reached (active users who logged in this month)
    const accountsReachedCount = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });

    // Count daily active users (active users who logged in today)
    const dailyActiveUsersCount = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });

    // Count weekly active users (active users who logged in this week)
    const weeklyActiveUsersCount = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });

    // Update the analytics data
    analyticsData.newUsers = newUsersCount;
    analyticsData.newCourses = await Course.countDocuments({
      createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    analyticsData.totalUsers = activeUsersCount; // Only count active users
    analyticsData.totalCourses = await Course.countDocuments();
    analyticsData.accountsReached = accountsReachedCount;
    analyticsData.usersLeft = usersLeftCount;
    analyticsData.dailyActiveUsers = dailyActiveUsersCount;
    analyticsData.weeklyActiveUsers = weeklyActiveUsersCount;

    // Calculate engagement rate (users who logged in this month / total active users)
    analyticsData.userEngagementRate =
      analyticsData.totalUsers > 0
        ? (analyticsData.accountsReached / analyticsData.totalUsers) * 100
        : 0;

    // Get devotion analytics
    analyticsData.totalDevotions = await Devotion.countDocuments();
    analyticsData.newDevotions = await Devotion.countDocuments({
      createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Estimate course completion rate (only for active users)
    const usersWithProgress = await User.countDocuments({
      progress: { $exists: true, $ne: [] },
      deletedAt: null,
    });
    analyticsData.courseCompletionRate =
      analyticsData.totalUsers > 0
        ? (usersWithProgress / analyticsData.totalUsers) * 100
        : 0;

    // Estimate average session time (placeholder - in a real app you'd track this)
    analyticsData.averageSessionTime = Math.floor(Math.random() * 30) + 15; // 15-45 minutes

    await analyticsData.save();

    return analyticsData;
  } catch (error) {
    console.error(error);
    throw new Error("Internal server error");
  }
};

const getPerformanceAnalytics = async () => {
  try {
    // Get top performing users
    const topUsers = await User.find({
      progress: { $exists: true, $ne: [] },
    })
      .select("firstName lastName progress createdAt")
      .limit(10)
      .lean();

    // Get top courses by enrollment (placeholder)
    const topCourses = await Course.find()
      .select("title description createdAt")
      .limit(10)
      .lean();

    // Calculate weekly activity data (mock data for now)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayUsers = await User.countDocuments({
        lastLogin: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1
          ),
        },
      });

      weeklyActivity.push({
        date: date.toISOString().split("T")[0],
        activeUsers: dayUsers,
        percentage: Math.min(Math.max(dayUsers * 10, 20), 95), // Mock percentage
      });
    }

    return {
      topUsers: topUsers.map((user, index) => ({
        name: `${user.firstName} ${user.lastName}`,
        score: Math.floor(Math.random() * 30) + 70, // Mock score 70-100
        courses: user.progress ? user.progress.length : 0,
        rank: index + 1,
      })),
      topCourses: topCourses.map((course, index) => ({
        title: course.title,
        completion: Math.floor(Math.random() * 30) + 60, // Mock completion 60-90%
        students: Math.floor(Math.random() * 100) + 50, // Mock student count
        rank: index + 1,
      })),
      weeklyActivity,
      systemMetrics: {
        apiUptime: 99.2,
        databaseHealth: 98.5,
        averageResponseTime: Math.floor(Math.random() * 100) + 150, // Mock response time
        totalRequests: Math.floor(Math.random() * 1000) + 5000,
      },
    };
  } catch (error) {
    console.error(error);
    throw new Error("Internal server error");
  }
};

module.exports = {
  getAnalytics,
  getPerformanceAnalytics,
};
