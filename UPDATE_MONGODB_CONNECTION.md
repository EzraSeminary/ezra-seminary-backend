# MongoDB Connection String Update Guide

## Problem
Your MongoDB connection is failing because the hostname `ezra-seminary-cluster.qjadzjl.mongodb.net` cannot be resolved via DNS.

## Solution

### Step 1: Log into MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Log in with your credentials

### Step 2: Check Your Cluster
1. Navigate to **Database** (left sidebar)
2. Look for your cluster (should be named something like "ezra-seminary-cluster")
3. Check its status:
   - ✓ Green = Running (good!)
   - ⚠️ Orange = Warning/Paused
   - ✗ Red = Error
   - 🔍 Missing = Cluster was deleted

### Step 3: Get New Connection String

#### If Cluster Exists:
1. Click **Connect** button on your cluster
2. Choose **"Connect your application"** (or "Drivers")
3. Select **Node.js** as driver
4. Copy the connection string that looks like:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster-name.xxxxx.mongodb.net/DATABASE?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual MongoDB password
6. Replace `<database>` if needed (or it will use default)

#### If Cluster Was Deleted:
You'll need to either:
- **Restore from backup** (if you have one in Atlas)
- **Create a new cluster** and restore your data
- **Contact MongoDB support** if this was accidental

### Step 4: Update .env File
1. Open `/Users/amanwtsegaw/Desktop/Melak_Project/Main/ezra_backend/.env`
2. Find the line starting with `MONGODB_KEY=`
3. Replace it with your new connection string:
   ```
   MONGODB_KEY=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database?retryWrites=true&w=majority
   ```
4. **Important**: Make sure there are NO spaces around the `=` sign
5. **Important**: Replace `<password>` with your actual password

### Step 5: Test Connection
After updating `.env`, run:
```bash
cd /Users/amanwtsegaw/Desktop/Melak_Project/Main/ezra_backend
node check-env.js
node diagnose-mongodb.js
```

Both should show ✓ SUCCESS

### Step 6: Run Migration
Once connection is working:
```bash
node migrate-database-urls.js
```

## IP Whitelist
If connection works but still fails, you may need to whitelist your IP in MongoDB Atlas:
1. In Atlas, go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Either:
   - Add your current IP
   - Add `0.0.0.0/0` to allow all IPs (less secure, but works everywhere)

## Common Issues

### "Authentication failed"
- Check username and password in connection string
- Make sure you replaced `<password>` with actual password
- Password may contain special characters that need URL encoding

### "Connection timeout"
- Check Network Access IP whitelist in Atlas
- Check if you're behind a VPN or firewall
- Try from a different network

### "Hostname not found" (current issue)
- Cluster doesn't exist or was renamed
- Get fresh connection string from Atlas
- Verify cluster is running

## Need Help?
Run these diagnostic scripts:
- `node check-env.js` - Check if .env is configured correctly
- `node diagnose-mongodb.js` - Test DNS and connection
- `node test-connection.js` - Full connection test

## Files Created for Debugging
- `check-env.js` - Verify environment variables
- `diagnose-mongodb.js` - DNS and connection diagnostics
- `test-connection.js` - Full connection test with retry logic

You can delete these after fixing the issue.


