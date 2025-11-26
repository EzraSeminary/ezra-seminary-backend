// migrate-database-urls.js
// This script updates all Cloudinary URLs in MongoDB to ImageKit URLs

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const connectDb = require("./config/connectDb");

// Load migration log
const migrationLog = JSON.parse(
  fs.readFileSync("imagekit_migration_log.json", "utf8")
);

// Create a map of Cloudinary URLs to ImageKit URLs
const urlMap = {};
migrationLog.forEach((entry) => {
  if (entry.status === "success") {
    urlMap[entry.cloudinaryUrl] = entry.imagekitUrl;
  }
});

// Connect to MongoDB using the same method as the server
connectDb()
  .then(() => {
    console.log("Connected to MongoDB");
    migrateDatabase();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    console.error("\nTroubleshooting tips:");
    console.error("1. Check your internet connection");
    console.error(
      "2. Verify MongoDB Atlas IP whitelist includes your current IP"
    );
    console.error("3. Check if you're behind a VPN or firewall");
    console.error("4. Try connecting from a different network");
    console.error("5. Verify your MONGODB_KEY connection string is correct");
    console.error(
      "6. Try running your server first to verify the connection works"
    );
    process.exit(1);
  });

async function migrateDatabase() {
  try {
    // Import models
    const Devotion = require("./models/Devotion");
    const DevotionPlan = require("./models/DevotionPlan");
    const User = require("./models/User");
    const Course = require("./models/Course");

    let totalUpdated = 0;

    // Migrate Devotions
    console.log("\n=== Migrating Devotions ===");
    const devotions = await Devotion.find({});
    let devotionUpdates = 0;
    for (const devotion of devotions) {
      if (devotion.image && urlMap[devotion.image]) {
        const oldUrl = devotion.image;
        devotion.image = urlMap[devotion.image];
        await devotion.save();
        devotionUpdates++;
        console.log(
          `Updated devotion ${devotion._id}: ${oldUrl} -> ${devotion.image}`
        );
      }
    }
    console.log(`Updated ${devotionUpdates} devotions`);
    totalUpdated += devotionUpdates;

    // Migrate Devotion Plans
    console.log("\n=== Migrating Devotion Plans ===");
    const devotionPlans = await DevotionPlan.find({});
    let planUpdates = 0;
    for (const plan of devotionPlans) {
      if (plan.image && urlMap[plan.image]) {
        const oldUrl = plan.image;
        plan.image = urlMap[plan.image];
        await plan.save();
        planUpdates++;
        console.log(`Updated plan ${plan._id}: ${oldUrl} -> ${plan.image}`);
      }
    }
    console.log(`Updated ${planUpdates} devotion plans`);
    totalUpdated += planUpdates;

    // Migrate Users
    console.log("\n=== Migrating Users ===");
    const users = await User.find({});
    let userUpdates = 0;
    for (const user of users) {
      if (user.avatar && urlMap[user.avatar]) {
        const oldUrl = user.avatar;
        user.avatar = urlMap[user.avatar];
        await user.save();
        userUpdates++;
        console.log(`Updated user ${user._id}: ${oldUrl} -> ${user.avatar}`);
      }
    }
    console.log(`Updated ${userUpdates} users`);
    totalUpdated += userUpdates;

    // Migrate Courses (more complex - nested structure)
    console.log("\n=== Migrating Courses ===");
    const courses = await Course.find({});
    let courseUpdates = 0;
    for (const course of courses) {
      let courseChanged = false;

      // Update course image
      if (course.image && urlMap[course.image]) {
        const oldUrl = course.image;
        course.image = urlMap[course.image];
        courseChanged = true;
        console.log(
          `Updated course ${course._id} image: ${oldUrl} -> ${course.image}`
        );
      }

      // Update chapter slides and elements
      if (course.chapters && Array.isArray(course.chapters)) {
        for (const chapter of course.chapters) {
          if (chapter.slides && Array.isArray(chapter.slides)) {
            for (const slide of chapter.slides) {
              if (slide.elements && Array.isArray(slide.elements)) {
                for (const element of slide.elements) {
                  if (
                    element.type === "img" &&
                    element.value &&
                    urlMap[element.value]
                  ) {
                    const oldUrl = element.value;
                    element.value = urlMap[element.value];
                    courseChanged = true;
                    console.log(
                      `Updated course element image: ${oldUrl} -> ${element.value}`
                    );
                  } else if (
                    element.type === "audio" &&
                    element.value &&
                    urlMap[element.value]
                  ) {
                    const oldUrl = element.value;
                    element.value = urlMap[element.value];
                    courseChanged = true;
                    console.log(
                      `Updated course element audio: ${oldUrl} -> ${element.value}`
                    );
                  } else if (
                    element.type === "mix" &&
                    element.value &&
                    element.value.file &&
                    urlMap[element.value.file]
                  ) {
                    const oldUrl = element.value.file;
                    element.value.file = urlMap[element.value.file];
                    courseChanged = true;
                    console.log(
                      `Updated course element mix file: ${oldUrl} -> ${element.value.file}`
                    );
                  }
                }
              }
            }
          }
        }
      }

      if (courseChanged) {
        await course.save();
        courseUpdates++;
      }
    }
    console.log(`Updated ${courseUpdates} courses`);
    totalUpdated += courseUpdates;

    console.log("\n=== Database Migration Complete ===");
    console.log(`Total documents updated: ${totalUpdated}`);

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Database migration error:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}
