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
    // Top users by number of courses in progress
    const topUsersRaw = await User.find({ deletedAt: null })
      .select("firstName lastName progress lastLogin")
      .lean();

    const topUsers = topUsersRaw
      .map((u) => ({
        name: `${u.firstName} ${u.lastName}`,
        courses: Array.isArray(u.progress) ? u.progress.length : 0,
        lastLogin: u.lastLogin || new Date(0),
      }))
      .sort((a, b) => {
        const byCourses = b.courses - a.courses;
        if (byCourses !== 0) return byCourses;
        const aTime = a.lastLogin instanceof Date ? a.lastLogin.getTime() : new Date(a.lastLogin).getTime();
        const bTime = b.lastLogin instanceof Date ? b.lastLogin.getTime() : new Date(b.lastLogin).getTime();
        return bTime - aTime;
      })
      .slice(0, 10)
      .map((u, idx) => ({
        name: u.name,
        courses: u.courses,
        score: 70 + Math.min(u.courses * 5, 30), // deterministic-ish score by engagement
        rank: idx + 1,
      }));

    // Top courses by number of users having progress entries
    const enrollmentAgg = await User.aggregate([
      { $match: { deletedAt: null } },
      { $unwind: "$progress" },
      { $group: { _id: "$progress.courseId", students: { $sum: 1 } } },
      { $sort: { students: -1 } },
      { $limit: 10 },
    ]);

    const courseIdToStudents = new Map(enrollmentAgg.map((e) => [e._id, e.students]));
    const courseIds = Array.from(courseIdToStudents.keys());
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("title")
      .lean();
    const idToTitle = new Map(courses.map((c) => [String(c._id), c.title]));

    const maxStudents = Math.max(1, ...Array.from(courseIdToStudents.values()));
    const topCourses = courseIds.map((id, idx) => ({
      title: idToTitle.get(String(id)) || "Unknown Course",
      students: courseIdToStudents.get(id) || 0,
      completion: Math.floor(((courseIdToStudents.get(id) || 0) / maxStudents) * 100),
      rank: idx + 1,
    }));

    // Weekly activity (users who logged in each day)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      const dayUsers = await User.countDocuments({ lastLogin: { $gte: dayStart, $lt: dayEnd }, deletedAt: null });
      weeklyActivity.push({
        date: dayStart.toISOString().split("T")[0],
        activeUsers: dayUsers,
        percentage: Math.min(Math.max(dayUsers * 10, 10), 95),
      });
    }

    return {
      topUsers,
      topCourses,
      weeklyActivity,
      systemMetrics: {
        apiUptime: 99.2,
        databaseHealth: 98.5,
        averageResponseTime: 200,
        totalRequests: 6000,
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
