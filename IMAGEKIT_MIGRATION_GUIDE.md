# Complete ImageKit.io Migration Guide

This guide provides step-by-step instructions to migrate from Cloudinary to ImageKit.io.

## Prerequisites

1. ✅ ImageKit.io account created
2. ✅ Cloudinary assets exported (`cloudinary_assets.json` exists)
3. ✅ Cloudinary assets downloaded (`cloudinary_backup/` folder exists)

## Step 1: Install Dependencies

Install the ImageKit SDK:

```bash
cd ezra_backend
npm install imagekit
```

## Step 2: Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

**How to get these values:**
1. Log in to your ImageKit.io dashboard
2. Go to **Settings** → **API Keys**
3. Copy:
   - **Public Key** → `IMAGEKIT_PUBLIC_KEY`
   - **Private Key** → `IMAGEKIT_PRIVATE_KEY`
   - **URL Endpoint** → `IMAGEKIT_URL_ENDPOINT` (format: `https://ik.imagekit.io/your_imagekit_id`)

## Step 3: Migrate Assets to ImageKit

Run the migration script to upload all Cloudinary assets to ImageKit:

```bash
node migrate-to-imagekit.js
```

**What this script does:**
- Reads `cloudinary_assets.json`
- Downloads each asset from Cloudinary
- Uploads to ImageKit with the same folder structure:
  - `/Devotion` folder
  - `/UserImage` folder
  - `/Courses` folder
- Creates `imagekit_migration_log.json` with mapping of old URLs to new URLs

**Expected output:**
```
Starting migration of 13078 assets...
[1/13078] Migrating: Devotion/image1.jpg -> /Devotion/image1.jpg
✓ Success: https://ik.imagekit.io/your_id/Devotion/image1.jpg
...
=== Migration Complete ===
Total assets: 13078
Successful: 13078
Errors: 0
Migration log saved to: imagekit_migration_log.json
```

**Note:** This may take a while depending on the number of assets. The script includes rate limiting to avoid API throttling.

## Step 4: Update Database URLs

After all assets are migrated, update all URLs in your MongoDB database:

```bash
node migrate-database-urls.js
```

**What this script does:**
- Reads `imagekit_migration_log.json`
- Updates all Cloudinary URLs in:
  - `Devotion` model (image field)
  - `DevotionPlan` model (image field)
  - `User` model (avatar field)
  - `Course` model (image field and nested chapter/slide elements)

**Expected output:**
```
Connected to MongoDB
=== Migrating Devotions ===
Updated devotion 507f1f77bcf86cd799439011: https://res.cloudinary.com/... -> https://ik.imagekit.io/...
...
=== Database Migration Complete ===
Total documents updated: 1500
```

## Step 5: Verify Migration

1. **Check ImageKit Dashboard:**
   - Log in to ImageKit.io
   - Go to **Media Library**
   - Verify folders: `/Devotion`, `/UserImage`, `/Courses`
   - Check that all files are present

2. **Test API Endpoints:**
   - Test creating a new devotion with image upload
   - Test creating a new user with avatar upload
   - Test creating a new course with image/audio upload
   - Verify URLs returned are ImageKit URLs

3. **Check Database:**
   - Query a few devotions and verify image URLs are ImageKit URLs
   - Query a few users and verify avatar URLs are ImageKit URLs
   - Query a few courses and verify all nested image/audio URLs are ImageKit URLs

## Step 6: Code Changes Summary

The following files have been updated to use ImageKit:

### Middleware Files (New):
- ✅ `middleware/imagekit.js` - For devotions
- ✅ `middleware/imagekit-users.js` - For user images
- ✅ `middleware/imagekit-course.js` - For course images/audio

### Controller Files (Updated):
- ✅ `controllers/courseController.js` - Now uses ImageKit
- ✅ `controllers/devotionController.js` - Now uses ImageKit
- ✅ `controllers/devotionPlanController.js` - Now uses ImageKit
- ✅ `controllers/usersController.js` - Now uses ImageKit

### Migration Scripts (New):
- ✅ `migrate-to-imagekit.js` - Uploads assets to ImageKit
- ✅ `migrate-database-urls.js` - Updates database URLs

## Step 7: Cleanup (Optional)

After successful migration and verification:

1. **Backup old files** (keep for safety):
   ```bash
   mkdir -p cloudinary_backup_archive
   mv cloudinary_backup cloudinary_backup_archive/
   mv cloudinary_assets.json cloudinary_backup_archive/
   ```

2. **Remove Cloudinary dependencies** (optional, if you want to completely remove):
   ```bash
   npm uninstall cloudinary multer-storage-cloudinary
   ```

3. **Remove old middleware** (optional):
   - `middleware/cloudinary.js`
   - `middleware/cloudinary-users.js`
   - `middleware/cloudinary-course.js`

**⚠️ Important:** Only do cleanup after you've verified everything works correctly!

## Troubleshooting

### Issue: Migration script fails with "Invalid API key"
**Solution:** Double-check your `.env` file has the correct ImageKit credentials.

### Issue: Some assets fail to upload
**Solution:** Check the `imagekit_migration_log.json` for failed entries. You can re-run the migration script (it will skip already uploaded files if you modify it, or manually upload failed assets).

### Issue: Database URLs not updating
**Solution:** 
- Ensure `imagekit_migration_log.json` exists and has successful entries
- Check MongoDB connection string in `.env`
- Verify the URL mapping is correct

### Issue: New uploads not working
**Solution:**
- Verify environment variables are set correctly
- Check ImageKit dashboard for API usage limits
- Review server logs for specific error messages

## Rollback Plan

If you need to rollback to Cloudinary:

1. Restore Cloudinary middleware files
2. Update controllers to use Cloudinary middleware
3. Revert database URLs (you'll need a backup or use the migration log to map back)
4. Reinstall Cloudinary dependencies: `npm install cloudinary multer-storage-cloudinary`

## Support

For ImageKit-specific issues, refer to:
- [ImageKit Documentation](https://docs.imagekit.io/)
- [ImageKit Node.js SDK](https://github.com/imagekit-developer/imagekit-nodejs)

## Migration Checklist

- [ ] Step 1: Install ImageKit SDK
- [ ] Step 2: Configure environment variables
- [ ] Step 3: Run asset migration script
- [ ] Step 4: Run database URL migration script
- [ ] Step 5: Verify migration (test uploads, check database)
- [ ] Step 6: Test all API endpoints
- [ ] Step 7: Optional cleanup

---

**Migration completed on:** [Date]
**Total assets migrated:** [Number]
**Database records updated:** [Number]

