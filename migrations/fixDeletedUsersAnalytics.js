require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Analytics = require("../models/Analytics");

const fixDeletedUsersAnalytics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_KEY, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Get all users
    const allUsers = await User.find({});
    console.log(`Total users in database: ${allUsers.length}`);

    // Count active users (not deleted)
    const activeUsers = await User.countDocuments({ deletedAt: null });
    console.log(`Active users: ${activeUsers}`);

    // Count users who haven't logged in for 60+ days
    const inactiveUsers = await User.countDocuments({
      lastLogin: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });
    console.log(`Inactive users (60+ days): ${inactiveUsers}`);

    // Count users with deletedAt set
    const softDeletedUsers = await User.countDocuments({
      deletedAt: { $ne: null },
    });
    console.log(`Soft deleted users: ${softDeletedUsers}`);

    // Calculate total users left
    const totalUsersLeft = inactiveUsers + softDeletedUsers;
    console.log(`Total users left: ${totalUsersLeft}`);

    // Update or create analytics record
    let analyticsData = await Analytics.findOne();
    if (!analyticsData) {
      analyticsData = new Analytics();
    }

    analyticsData.totalUsers = activeUsers;
    analyticsData.usersLeft = totalUsersLeft;
    analyticsData.newUsers = await User.countDocuments({
      createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });
    analyticsData.accountsReached = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    });

    await analyticsData.save();
    console.log("Analytics data updated successfully");

    console.log("Migration completed: Fixed deleted users analytics");
    mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.disconnect();
  }
};

fixDeletedUsersAnalytics();
