const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    newUsers: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    newCourses: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    accountsReached: { type: Number, default: 0 },
    usersLeft: { type: Number, default: 0 },
    dailyActiveUsers: { type: Number, default: 0 },
    weeklyActiveUsers: { type: Number, default: 0 },
    averageSessionTime: { type: Number, default: 0 }, // in minutes
    courseCompletionRate: { type: Number, default: 0 }, // percentage
    userEngagementRate: { type: Number, default: 0 }, // percentage
    totalDevotions: { type: Number, default: 0 },
    newDevotions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;
