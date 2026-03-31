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
---

## Email: Resend as Primary (recommended for contact & reply)

Use **Resend** as the main sender so contact form notifications and admin replies don’t depend on Gmail/SMTP (avoids "Invalid login" and daily breakage).

### Step 1: Create a Resend account

1. Go to [resend.com](https://resend.com) and sign up (free tier is enough to start).
2. Verify your email and log in to the Resend dashboard.

### Step 2: Get your API key

1. In the Resend dashboard, open **API Keys** (left sidebar or [resend.com/api-keys](https://resend.com/api-keys)).
2. Click **Create API Key**.
3. Give it a name (e.g. `Ezra Backend`).
4. Choose permission **Sending access**.
5. Copy the key (it starts with `re_`). You won’t see it again.

### Step 3: Add and verify your sender (EMAIL_FROM_ADDRESS)

You must send from a **verified** address or domain.

**Option A – Use Resend’s test domain (quickest)**  
- In Resend go to **Domains** and check the default **onboarding.resend.dev** domain.  
- You can send from any address like: `Ezra Seminary <onboarding@resend.dev>`.  
- Set in `.env`:  
  `EMAIL_FROM_ADDRESS=Ezra Seminary <onboarding@resend.dev>`

**Option B – Use your own domain (recommended for production)**  
1. In Resend go to **Domains** → **Add Domain**.  
2. Enter your domain (e.g. `ezraseminary.org`).  
3. Resend will show DNS records (SPF, DKIM, etc.). Add them in your DNS provider (where you bought the domain).  
4. In Resend, click **Verify**. Wait until status is **Verified**.  
5. Then you can use e.g. `noreply@ezraseminary.org` or `Ezra Seminary <noreply@ezraseminary.org>`.  
6. Set in `.env`:  
   `EMAIL_FROM_ADDRESS=Ezra Seminary <noreply@ezraseminary.org>`

### Step 4: Set environment variables

**Local (in `ezra_backend/.env`):**

```bash
# Resend (primary for contact form & admin replies)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=Ezra Seminary <onboarding@resend.dev>
```

**Production (Render / Railway / etc.):**  
Add the same two variables in your backend service’s environment:

- `RESEND_API_KEY` = your Resend API key (e.g. `re_...`).  
- `EMAIL_FROM_ADDRESS` = the exact “From” address you verified (e.g. `Ezra Seminary <onboarding@resend.dev>` or `noreply@ezraseminary.org`).

Optional, for reply-to on admin replies:

```bash
EMAIL_REPLY_TO=noreply@ezraseminary.org
```

### Step 5: Restart and test

1. Restart the backend (local: stop/start; production: redeploy).
2. Test the contact form: submit a message and confirm you receive the notification at the address you use for inbound (e.g. `EMAIL_TO_ADDRESS` or the default).
3. Test admin reply: open a contact in the admin panel, send a reply, and confirm the user receives it.

### How the app uses Resend

- If **both** `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` are set, the app uses Resend as the **primary** sender for:
  - Contact form notifications (new message to you).
  - Admin replies to users.
- If Resend is not configured, it falls back to SMTP/Gmail (existing `EMAIL_USER` / `EMAIL_PASS` or SMTP vars).
- If you still have Gmail/SMTP configured and Resend is primary, the code can fall back to SMTP when Resend fails (e.g. rate limit or temporary error).

### Checklist

- [ ] Resend account created and API key copied.
- [ ] Sender set: either `onboarding@resend.dev` or your verified domain address.
- [ ] `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` set in `.env` (local) and in hosting (production).
- [ ] Backend restarted / redeployed.
- [ ] Contact form and admin reply tested.

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

