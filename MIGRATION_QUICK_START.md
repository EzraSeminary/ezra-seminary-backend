# ImageKit Migration - Quick Start

## 🚀 Quick Steps

### 1. Install Dependencies
```bash
npm install imagekit
```

### 2. Add to `.env`
```env
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### 3. Migrate Assets
```bash
node migrate-to-imagekit.js
```
⏱️ This will take time depending on number of assets (you have ~13,000)

### 4. Update Database
```bash
node migrate-database-urls.js
```

### 5. Test
- Create a new devotion with image
- Create a new user with avatar
- Create a new course with image/audio
- Verify URLs are ImageKit URLs

## ✅ What's Already Done

- ✅ ImageKit middleware created (`middleware/imagekit*.js`)
- ✅ All controllers updated to use ImageKit
- ✅ Migration scripts created
- ✅ Package.json updated

## 📋 Files Changed

**New Files:**
- `middleware/imagekit.js`
- `middleware/imagekit-users.js`
- `middleware/imagekit-course.js`
- `migrate-to-imagekit.js`
- `migrate-database-urls.js`
- `IMAGEKIT_MIGRATION_GUIDE.md`

**Updated Files:**
- `package.json` (added imagekit dependency)
- `controllers/courseController.js`
- `controllers/devotionController.js`
- `controllers/devotionPlanController.js`
- `controllers/usersController.js`

## ⚠️ Important Notes

1. **Keep Cloudinary credentials** until migration is verified
2. **Backup your database** before running `migrate-database-urls.js`
3. **Test thoroughly** before removing Cloudinary dependencies
4. The migration scripts will create logs - check them for any errors

## 🆘 Need Help?

See `IMAGEKIT_MIGRATION_GUIDE.md` for detailed instructions and troubleshooting.

