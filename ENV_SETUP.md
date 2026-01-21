# Environment Variables Setup

## ⚠️ IMPORTANT: Security
The `.env` file is **NOT** in git for security reasons. You must set environment variables on your hosting platform.

## Required Environment Variables

Set these in your hosting platform's environment variables section (Render, Railway, Heroku, etc.):

```bash
# Server Configuration
PORT=5100

# Database
MONGODB_KEY=mongodb+srv://your_connection_string

# Security
SECRET=your_jwt_secret_key_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Frontend URL
FRONTEND_URL=https://ezraseminary.org

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## How to Set on Hosting Platform

### Render.com
1. Go to your service dashboard
2. Click "Environment" tab
3. Add each variable as a key-value pair
4. Save and redeploy

### Railway
1. Go to your project
2. Click on your service
3. Go to "Variables" tab
4. Add each variable
5. Service will auto-restart

### Other Platforms
- Look for "Environment Variables", "Config Vars", or "Secrets" section
- Add each variable
- Restart/redeploy the service

## Local Development

For local development, create a `.env` file in the `ezra_backend` directory with the same variables.

## Note on CORS

**CORS does NOT depend on .env variables** - it's configured in code and will work regardless of environment variables.

## ⚠️ CRITICAL: After Setting Environment Variables

1. **Restart/Redeploy your service** - Environment variables only take effect after restart
2. **Check server logs** - Verify the server started successfully
3. **Test CORS** - CORS should work immediately, even if DB connection fails

## Quick Checklist

- [ ] Set all environment variables on hosting platform
- [ ] Restart/redeploy the service
- [ ] Check server logs for startup messages
- [ ] Test API endpoints from frontend
- [ ] Verify CORS headers are present in browser DevTools

