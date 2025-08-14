// Migration to add year field to existing devotions
const mongoose = require("mongoose");
const { getCurrentEthiopianYear } = require("../utils/devotionUtils");
const connectDb = require("../config/connectDb");
require("dotenv").config();

const addYearFieldToDevotions = async () => {
  try {
    console.log("Starting migration: Adding year field to devotions...");

    // Connect to MongoDB using the existing connection method
    if (mongoose.connection.readyState === 0) {
      await connectDb();
    }

    const Devotion = mongoose.model("Devotion");

    // Get current Ethiopian year as default
    const currentYear = getCurrentEthiopianYear();

    // Find all devotions without a year field
    const devotionsWithoutYear = await Devotion.find({
      $or: [{ year: { $exists: false } }, { year: null }],
    });

    console.log(
      `Found ${devotionsWithoutYear.length} devotions without year field.`
    );

    if (devotionsWithoutYear.length > 0) {
      // Update all devotions without year to use current Ethiopian year
      const result = await Devotion.updateMany(
        {
          $or: [{ year: { $exists: false } }, { year: null }],
        },
        {
          $set: { year: currentYear },
        }
      );

      console.log(
        `Updated ${result.modifiedCount} devotions with year ${currentYear}.`
      );
    }

    console.log("Migration completed successfully!");

    // Close connection if we opened it
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  addYearFieldToDevotions();
}

module.exports = addYearFieldToDevotions;
