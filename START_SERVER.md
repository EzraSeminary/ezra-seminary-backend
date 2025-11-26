# Server won't start - ImageKit Configuration Missing

Your server requires ImageKit environment variables. You need to add these to your `.env` file:

## Required Environment Variables

Add these to `/Users/amanwtsegaw/Desktop/Melak_Project/Main/ezra_backend/.env`:

```env
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## How to Get ImageKit Credentials

1. Go to https://imagekit.io/dashboard
2. Log in to your account
3. Go to **Developer options** → **API Keys**
4. Copy:
   - Public Key
   - Private Key
   - URL Endpoint

## Alternative: Start Server with Existing MongoDB Connection

If you don't have ImageKit credentials yet or don't want to restart the server, you can run the migration directly using mongoose:

### Quick Migration Script (No Server Needed)

Save this as `migrate-now.js` and run it:

```javascript
// This uses your existing working MongoDB connection
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");

(async () => {
  try {
    // Connect with very long timeout
    await mongoose.connect(process.env.MONGODB_KEY, {
      serverSelectionTimeoutMS: 120000,
      socketTimeoutMS: 120000,
    });
    
    console.log("Connected!");
    
    const migrationLog = JSON.parse(fs.readFileSync("imagekit_migration_log.json", "utf8"));
    const urlMap = {};
    migrationLog.forEach(e => {
      if (e.status === "success") urlMap[e.cloudinaryUrl] = e.imagekitUrl;
    });
    
    const Devotion = require("./models/Devotion");
    const DevotionPlan = require("./models/DevotionPlan");
    const User = require("./models/User");
    const Course = require("./models/Course");
    
    let total = 0;
    
    // Devotions
    for (const d of await Devotion.find({})) {
      if (d.image && urlMap[d.image]) {
        d.image = urlMap[d.image];
        await d.save();
        total++;
      }
    }
    
    // Plans
    for (const p of await DevotionPlan.find({})) {
      if (p.image && urlMap[p.image]) {
        p.image = urlMap[p.image];
        await p.save();
        total++;
      }
    }
    
    // Users
    for (const u of await User.find({})) {
      if (u.avatar && urlMap[u.avatar]) {
        u.avatar = urlMap[u.avatar];
        await u.save();
        total++;
      }
    }
    
    // Courses
    for (const c of await Course.find({})) {
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
        total++;
      }
    }
    
    console.log(`\n✅ Migration complete! Updated ${total} documents`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
```

Run it:
```bash
node migrate-now.js
```


