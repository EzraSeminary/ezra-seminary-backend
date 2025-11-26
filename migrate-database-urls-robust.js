// migrate-database-urls-robust.js
// This script updates all Cloudinary URLs in MongoDB to ImageKit URLs
// With robust connection handling for DNS timeout issues

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

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

console.log(
  `Loaded ${Object.keys(urlMap).length} URL mappings from migration log\n`
);

// Robust connection function with retries
async function connectToMongoDB(maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Connecting to MongoDB (attempt ${attempt}/${maxRetries})...`
      );

      const connect = await mongoose.connect(process.env.MONGODB_KEY, {
        serverSelectionTimeoutMS: 90000, // 90 seconds - very generous
        connectTimeoutMS: 60000, // 60 seconds
        socketTimeoutMS: 60000,
        retryWrites: true,
        retryReads: true,
        maxPoolSize: 10,
      });

      console.log("✓ Connected to MongoDB");
      console.log(`  Host: ${connect.connection.host}`);
      console.log(`  Database: ${connect.connection.name}\n`);
      return connect;
    } catch (error) {
      console.error(`✗ Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const waitTime = Math.min(2000 * attempt, 10000); // Exponential backoff, max 10s
        console.log(`  Retrying in ${waitTime / 1000} seconds...\n`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        console.error("\n❌ All connection attempts failed");
        console.error(
          "Since your server works fine, this might be a temporary DNS issue."
        );
        console.error("\nTry these:");
        console.error("1. Wait a few minutes and try again");
        console.error(
          "2. Check if you're on VPN - try disconnecting temporarily"
        );
        console.error(
          "3. Try: sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder"
        );
        console.error(
          "4. Check your DNS settings (System Preferences → Network → Advanced → DNS)"
        );
        throw error;
      }
    }
  }
}

async function migrateDatabase() {
  try {
    // Import models
    const Devotion = require("./models/Devotion");
    const DevotionPlan = require("./models/DevotionPlan");
    const User = require("./models/User");
    const Course = require("./models/Course");

    let totalUpdated = 0;

    // Migrate Devotions
    console.log("=== Migrating Devotions ===");
    const devotions = await Devotion.find({});
    console.log(`Found ${devotions.length} devotions`);
    let devotionUpdates = 0;
    for (const devotion of devotions) {
      if (devotion.image && urlMap[devotion.image]) {
        const oldUrl = devotion.image;
        devotion.image = urlMap[devotion.image];
        await devotion.save();
        devotionUpdates++;
        console.log(
          `  Updated devotion ${devotion._id}: ${path.basename(oldUrl)}`
        );
      }
    }
    console.log(`✓ Updated ${devotionUpdates} devotions\n`);
    totalUpdated += devotionUpdates;

    // Migrate Devotion Plans
    console.log("=== Migrating Devotion Plans ===");
    const devotionPlans = await DevotionPlan.find({});
    console.log(`Found ${devotionPlans.length} devotion plans`);
    let planUpdates = 0;
    for (const plan of devotionPlans) {
      if (plan.image && urlMap[plan.image]) {
        const oldUrl = plan.image;
        plan.image = urlMap[plan.image];
        await plan.save();
        planUpdates++;
        console.log(`  Updated plan ${plan._id}: ${plan.title || "Untitled"}`);
      }
    }
    console.log(`✓ Updated ${planUpdates} devotion plans\n`);
    totalUpdated += planUpdates;

    // Migrate Users
    console.log("=== Migrating Users ===");
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    let userUpdates = 0;
    for (const user of users) {
      if (user.avatar && urlMap[user.avatar]) {
        const oldUrl = user.avatar;
        user.avatar = urlMap[user.avatar];
        await user.save();
        userUpdates++;
        console.log(`  Updated user ${user._id}: ${user.email || "No email"}`);
      }
    }
    console.log(`✓ Updated ${userUpdates} users\n`);
    totalUpdated += userUpdates;

    // Migrate Courses (more complex - nested structure)
    console.log("=== Migrating Courses ===");
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses`);
    let courseUpdates = 0;
    for (const course of courses) {
      let courseChanged = false;

      // Update course image
      if (course.image && urlMap[course.image]) {
        const oldUrl = course.image;
        course.image = urlMap[course.image];
        courseChanged = true;
        console.log(
          `  Updated course ${course._id} image: ${course.title || "Untitled"}`
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
                    element.value = urlMap[element.value];
                    courseChanged = true;
                  } else if (
                    element.type === "audio" &&
                    element.value &&
                    urlMap[element.value]
                  ) {
                    element.value = urlMap[element.value];
                    courseChanged = true;
                  } else if (
                    element.type === "mix" &&
                    element.value &&
                    element.value.file &&
                    urlMap[element.value.file]
                  ) {
                    element.value.file = urlMap[element.value.file];
                    courseChanged = true;
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
    console.log(`✓ Updated ${courseUpdates} courses\n`);
    totalUpdated += courseUpdates;

    console.log("=== Database Migration Complete ===");
    console.log(`✅ Total documents updated: ${totalUpdated}`);

    await mongoose.connection.close();
    console.log("\nDatabase connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database migration error:", error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    await connectToMongoDB();
    await migrateDatabase();
  } catch (error) {
    console.error("\n❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
})();
