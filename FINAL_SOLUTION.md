# Final Solution: Run Migration via API

Since your server connects to MongoDB successfully but standalone scripts have DNS timeout issues, use your server's existing connection to run the migration.

## Step 1: Add ImageKit Credentials to .env (if not already there)

Add these to your `.env` file:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id_here
```

Get these from: https://imagekit.io/dashboard → Developer options → API Keys

## Step 2: Start Your Server

```bash
cd /Users/amanwtsegaw/Desktop/Melak_Project/Main/ezra_backend
node Server.js
```

Wait for it to connect to MongoDB.

## Step 3: Run the Migration

### Option A: Using cURL (Terminal)

1. First, get your admin token:
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email.com","password":"yourpassword"}'
```

2. Copy the `accessToken` from the response, then run:
```bash
curl -X POST http://localhost:3000/migration/run-imagekit-migration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option B: Using Postman/Insomnia/ThunderClient

1. **POST** `http://localhost:3000/users/login`
   - Body: `{"email":"your@email.com","password":"yourpass"}`
   - Copy the `accessToken`

2. **POST** `http://localhost:3000/migration/run-imagekit-migration`
   - Header: `Authorization: Bearer YOUR_TOKEN`

## What if I Don't Have ImageKit Credentials?

If your server uses ImageKit for uploads but you haven't set up the credentials yet, you have two options:

### Option 1: Temporarily Comment Out ImageKit Middleware

Edit `Server.js` or wherever imagekit is initialized, and comment it out temporarily:

```javascript
// const imagekit = require("./middleware/imagekit");  // Comment this out temporarily
```

This will let your server start without ImageKit credentials, then you can use the API approach above.

### Option 2: Use a Direct Database Script

If you can't start the server at all, the only solution is to fix the DNS issue:

1. **Check if you're on VPN** - Disconnect and try again
2. **Flush DNS cache**:
   ```bash
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```
3. **Try from a different network** (mobile hotspot, different WiFi)
4. **Check MongoDB Atlas** - Verify the cluster exists at https://cloud.mongodb.com

## Step 4: Verify Migration Success

After running the migration API, you should see output like:

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

## Step 5: Clean Up (Optional)

After successful migration, you can remove:
- `routes/migrationRoutes.js`
- The migration route from `Server.js`
- Test/diagnostic scripts: `check-env.js`, `diagnose-mongodb.js`, `migrate-now.js`

## Troubleshooting

### Server won't start - "Missing publicKey"
Add ImageKit credentials to `.env` (see Step 1 above)

### "Unauthorized" or "Forbidden"  
Make sure you're using an admin account

### DNS timeout persists everywhere
Your MongoDB cluster may not exist. Check MongoDB Atlas.

## Why This Works

- Your server successfully connects to MongoDB
- Once connected, it stays connected
- The API uses the existing connection
- No need to create new connections that hit DNS timeouts


