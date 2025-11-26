// migrate-now.js - Simplified migration script with extended timeout
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");

console.log("=== ImageKit URL Migration ===\n");

(async () => {
  try {
    console.log("Connecting to MongoDB (this may take up to 2 minutes)...");
    
    // Connect with VERY long timeout - wait for DNS to eventually resolve
    await mongoose.connect(process.env.MONGODB_KEY, {
      serverSelectionTimeoutMS: 120000, // 2 minutes
      connectTimeoutMS: 120000,
      socketTimeoutMS: 120000,
    });
    
    console.log("✓ Connected to MongoDB!\n");
    
    // Load migration log
    const migrationLog = JSON.parse(fs.readFileSync("imagekit_migration_log.json", "utf8"));
    const urlMap = {};
    migrationLog.forEach(e => {
      if (e.status === "success") urlMap[e.cloudinaryUrl] = e.imagekitUrl;
    });
    
    console.log(`Loaded ${Object.keys(urlMap).length} URL mappings\n`);
    
    // Import models
    const Devotion = require("./models/Devotion");
    const DevotionPlan = require("./models/DevotionPlan");
    const User = require("./models/User");
    const Course = require("./models/Course");
    
    let total = 0;
    
    // Migrate Devotions
    console.log("Migrating Devotions...");
    const devotions = await Devotion.find({});
    for (const d of devotions) {
      if (d.image && urlMap[d.image]) {
        d.image = urlMap[d.image];
        await d.save();
        total++;
        console.log(`  ✓ Updated devotion: ${d.title || d._id}`);
      }
    }
    console.log(`Updated ${devotions.filter(d => d.image && urlMap[d.image]).length} devotions\n`);
    
    // Migrate Devotion Plans
    console.log("Migrating Devotion Plans...");
    const plans = await DevotionPlan.find({});
    for (const p of plans) {
      if (p.image && urlMap[p.image]) {
        p.image = urlMap[p.image];
        await p.save();
        total++;
        console.log(`  ✓ Updated plan: ${p.title || p._id}`);
      }
    }
    console.log(`Updated ${plans.filter(p => p.image && urlMap[p.image]).length} plans\n`);
    
    // Migrate Users
    console.log("Migrating Users...");
    const users = await User.find({});
    for (const u of users) {
      if (u.avatar && urlMap[u.avatar]) {
        u.avatar = urlMap[u.avatar];
        await u.save();
        total++;
        console.log(`  ✓ Updated user: ${u.email || u._id}`);
      }
    }
    console.log(`Updated ${users.filter(u => u.avatar && urlMap[u.avatar]).length} users\n`);
    
    // Migrate Courses
    console.log("Migrating Courses...");
    const courses = await Course.find({});
    let courseCount = 0;
    for (const c of courses) {
      let changed = false;
      
      if (c.image && urlMap[c.image]) {
        c.image = urlMap[c.image];
        changed = true;
      }
      
      if (c.chapters) {
        for (const ch of c.chapters) {
          if (ch.slides) {
            for (const s of ch.slides) {
              if (s.elements) {
                for (const e of s.elements) {
                  if (e.type === "img" && e.value && urlMap[e.value]) {
                    e.value = urlMap[e.value];
                    changed = true;
                  } else if (e.type === "audio" && e.value && urlMap[e.value]) {
                    e.value = urlMap[e.value];
                    changed = true;
                  } else if (e.type === "mix" && e.value?.file && urlMap[e.value.file]) {
                    e.value.file = urlMap[e.value.file];
                    changed = true;
                  }
                }
              }
            }
          }
        }
      }
      
      if (changed) {
        await c.save();
        courseCount++;
        total++;
        console.log(`  ✓ Updated course: ${c.title || c._id}`);
      }
    }
    console.log(`Updated ${courseCount} courses\n`);
    
    console.log("=========================");
    console.log(`✅ Migration Complete!`);
    console.log(`Total documents updated: ${total}`);
    console.log("=========================\n");
    
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Migration failed:");
    console.error(err.message);
    
    if (err.message.includes("ETIMEOUT") || err.message.includes("queryTxt")) {
      console.error("\nDNS timeout persists. Try:");
      console.error("1. Disconnect from VPN if using one");
      console.error("2. Try from a different network");
      console.error("3. Run: sudo dscacheutil -flushcache");
      console.error("4. Check MongoDB Atlas to ensure cluster exists");
      console.error("5. Wait a few minutes and try again");
    }
    
    process.exit(1);
  }
})();


