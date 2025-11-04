# 🔍 Troubleshooting Failed Workflow

Your workflow ran but failed. Let's find out why!

## Step-by-Step Debugging

### 1. Check the Workflow Run Details

1. **Click on "Notification Reminders #1"** (the failed run)
2. **Look at the left sidebar** - you'll see the job name: "send-notifications"
3. **Click on "send-notifications"** to see the steps

### 2. Check Each Step

You should see two steps:
- **"Trigger Notification Scheduler"**
- **"Trigger Task Reminders"**

**Click on each step** to expand and see the logs.

### 3. Common Errors to Look For

#### Error: "401 Unauthorized"
**Cause:** CRON_SECRET doesn't match Vercel
**Fix:**
1. Go to Vercel: https://vercel.com/dashboard → aiprojecthub → Settings → Environment Variables
2. Copy the exact CRON_SECRET value (click eye icon)
3. Go to GitHub: https://github.com/vipervv3/aiprojecthub/settings/secrets/actions
4. Click on CRON_SECRET → "Update" → Paste the correct value → "Update secret"

#### Error: "Connection refused" or "Could not resolve host"
**Cause:** Wrong VERCEL_APP_URL
**Fix:**
1. Verify URL is: `https://aiprojecthub.vercel.app` (no trailing slash!)
2. Go to GitHub Secrets
3. Click on VERCEL_APP_URL → "Update" → Set to `https://aiprojecthub.vercel.app`

#### Error: "404 Not Found"
**Cause:** Wrong URL path
**Fix:** Make sure VERCEL_APP_URL is just the base URL: `https://aiprojecthub.vercel.app` (not including `/api/...`)

#### Error: "Response status: 401"
**Cause:** The Authorization header isn't working
**Fix:** Check that CRON_SECRET in GitHub matches exactly with Vercel (no extra spaces, no quotes)

## Quick Fix Checklist

- [ ] CRON_SECRET in GitHub matches Vercel exactly
- [ ] VERCEL_APP_URL is `https://aiprojecthub.vercel.app` (no trailing slash)
- [ ] Both secrets show as "Repository secrets" (not Environment secrets)
- [ ] Secrets are spelled exactly: `CRON_SECRET` and `VERCEL_APP_URL`

## After Fixing

1. Go back to Actions: https://github.com/vipervv3/aiprojecthub/actions
2. Click "Notification Reminders" workflow
3. Click "Run workflow" again
4. Wait for it to complete - should show ✅ green checkmark!



