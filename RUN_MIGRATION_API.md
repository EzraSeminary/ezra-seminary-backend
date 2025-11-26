# Run Migration via API (Workaround for DNS Issues)

Since the standalone script has DNS timeout issues but your server connects fine, use the server's existing MongoDB connection to run the migration.

## Quick Start

### Option 1: Use the Shell Script (Easiest)

```bash
cd /Users/amanwtsegaw/Desktop/Melak_Project/Main/ezra_backend
./run-migration-via-api.sh
```

It will prompt for your admin email and password, then run the migration.

### Option 2: Manual cURL Commands

1. **First, login to get your token:**

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"your-password"}'
```

Copy the `accessToken` from the response.

2. **Run the migration:**

```bash
curl -X POST http://localhost:3000/migration/run-imagekit-migration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Replace `YOUR_ACCESS_TOKEN` with the token from step 1.

### Option 3: Use Postman/Insomnia

1. **Login:**
   - POST `http://localhost:3000/users/login`
   - Body (JSON):
     ```json
     {
       "email": "your-admin@email.com",
       "password": "your-password"
     }
     ```
   - Copy the `accessToken`

2. **Run Migration:**
   - POST `http://localhost:3000/migration/run-imagekit-migration`
   - Headers:
     - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
     - `Content-Type`: `application/json`

## Expected Response

Success:
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "results": {
    "devotions": 10,
    "devotionPlans": 5,
    "users": 3,
    "courses": 2,
    "total": 20
  }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Requirements

- Server must be running (`node Server.js`)
- You must have admin credentials
- `imagekit_migration_log.json` must exist in the backend folder

## After Migration

Once complete, you can remove the migration route:
1. Delete `routes/migrationRoutes.js`
2. Remove the line from `Server.js`:
   ```javascript
   app.use("/migration", require("./routes/migrationRoutes"));
   ```

## Troubleshooting

### "Server is not running"
Start your server: `node Server.js`

### "Login failed"
- Check your email and password
- Make sure the account has admin privileges

### "imagekit_migration_log.json not found"
Run the ImageKit upload script first:
```bash
node migrate-to-imagekit.js
```

### "Unauthorized" or 403 error
- Your token may have expired - login again
- Your account may not have admin privileges


