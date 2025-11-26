// routes/migrationRoutes.js
// Temporary route to run migration using existing server connection

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Admin check middleware
const requireAdmin = require("../middleware/requireAdmin");
const verifyJWT = require("../middleware/requireAuth");

router.post("/run-imagekit-migration", verifyJWT, requireAdmin, async (req, res) => {
  try {
    console.log("Starting ImageKit URL migration...");
    
    // Load migration log
    const migrationLogPath = path.join(__dirname, "../imagekit_migration_log.json");
    if (!fs.existsSync(migrationLogPath)) {
      return res.status(400).json({ 
        error: "Migration log not found",
        message: "imagekit_migration_log.json not found. Run migrate-to-imagekit.js first."
      });
    }
    
    const migrationLog = JSON.parse(fs.readFileSync(migrationLogPath, "utf8"));
    
    // Create URL map
    const urlMap = {};
    migrationLog.forEach((entry) => {
      if (entry.status === "success") {
        urlMap[entry.cloudinaryUrl] = entry.imagekitUrl;
      }
    });
    
    console.log(`Loaded ${Object.keys(urlMap).length} URL mappings`);
    
    // Import models (using existing connection)
    const Devotion = require("../models/Devotion");
    const DevotionPlan = require("../models/DevotionPlan");
    const User = require("../models/User");
    const Course = require("../models/Course");
    
    const results = {
      devotions: 0,
      devotionPlans: 0,
      users: 0,
      courses: 0,
      total: 0
    };
    
    // Migrate Devotions
    console.log("Migrating Devotions...");
    const devotions = await Devotion.find({});
    for (const devotion of devotions) {
      if (devotion.image && urlMap[devotion.image]) {
        devotion.image = urlMap[devotion.image];
        await devotion.save();
        results.devotions++;
      }
    }
    
    // Migrate Devotion Plans
    console.log("Migrating Devotion Plans...");
    const devotionPlans = await DevotionPlan.find({});
    for (const plan of devotionPlans) {
      if (plan.image && urlMap[plan.image]) {
        plan.image = urlMap[plan.image];
        await plan.save();
        results.devotionPlans++;
      }
    }
    
    // Migrate Users
    console.log("Migrating Users...");
    const users = await User.find({});
    for (const user of users) {
      if (user.avatar && urlMap[user.avatar]) {
        user.avatar = urlMap[user.avatar];
        await user.save();
        results.users++;
      }
    }
    
    // Migrate Courses
    console.log("Migrating Courses...");
    const courses = await Course.find({});
    for (const course of courses) {
      let courseChanged = false;
      
      if (course.image && urlMap[course.image]) {
        course.image = urlMap[course.image];
        courseChanged = true;
      }
      
      if (course.chapters && Array.isArray(course.chapters)) {
        for (const chapter of course.chapters) {
          if (chapter.slides && Array.isArray(chapter.slides)) {
            for (const slide of chapter.slides) {
              if (slide.elements && Array.isArray(slide.elements)) {
                for (const element of slide.elements) {
                  if (element.type === "img" && element.value && urlMap[element.value]) {
                    element.value = urlMap[element.value];
                    courseChanged = true;
                  } else if (element.type === "audio" && element.value && urlMap[element.value]) {
                    element.value = urlMap[element.value];
                    courseChanged = true;
                  } else if (element.type === "mix" && element.value && element.value.file && urlMap[element.value.file]) {
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
        results.courses++;
      }
    }
    
    results.total = results.devotions + results.devotionPlans + results.users + results.courses;
    
    console.log("Migration complete:", results);
    
    res.json({
      success: true,
      message: "Migration completed successfully",
      results
    });
    
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;


