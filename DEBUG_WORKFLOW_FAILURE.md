# 🔍 Debug Workflow Failure

The workflow is failing. Let's diagnose the issue step by step.

## Step 1: Check the Actual Error in GitHub

1. Go to: https://github.com/vipervv3/aiprojecthub/actions
2. Click on "Notification Reminders #2" (the failed run)
3. Click on "send-notifications" job
4. **Expand each step** to see the error:

   - **"Trigger Notification Scheduler"** - Look for the error message
   - **"Trigger Task Reminders"** - Look for the error message

## Common Errors & Fixes

### Error: "Response status: 401"
**Problem:** CRON_SECRET doesn't match between GitHub and Vercel

**Fix:**
1. Get CRON_SECRET from Vercel:
   - Go to: https://vercel.com/dashboard
   - Click `aiprojecthub` project
   - Settings → Environment Variables
   - Find `CRON_SECRET` → Click eye icon → Copy exact value

2. Update GitHub Secret:
   - Go to: https://github.com/vipervv3/aiprojecthub/settings/secrets/actions
   - Click on `CRON_SECRET` → "Update"
   - Paste the value from Vercel (no extra spaces!)
   - Click "Update secret"

### Error: "Could not resolve host" or "Connection refused"
**Problem:** Wrong VERCEL_APP_URL

**Fix:**
- Verify URL is exactly: `https://aiprojecthub.vercel.app`
- No trailing slash
- No `/api/` path included
- Update in GitHub Secrets if needed

### Error: "404 Not Found"
**Problem:** Wrong URL path

**Fix:**
- Make sure VERCEL_APP_URL is: `https://aiprojecthub.vercel.app`
- The workflow adds `/api/cron/...` automatically

## Step 2: Test Locally

Run this PowerShell script to test the endpoints:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-endpoints.ps1
```

This will:
1. Ask for your CRON_SECRET (from Vercel)
2. Test both endpoints
3. Show you exactly what error you're getting

## Step 3: Verify Secrets in GitHub

1. Go to: https://github.com/vipervv3/aiprojecthub/settings/secrets/actions

2. Verify you see:
   - ✅ `CRON_SECRET` (should show as dots/***)
   - ✅ `VERCEL_APP_URL` (should show as dots/***)

3. Check spelling:
   - Must be exactly: `CRON_SECRET` (not `CRON_SECRETS` or `CRONSECRET`)
   - Must be exactly: `VERCEL_APP_URL` (case-sensitive)

## Step 4: Verify Vercel Endpoint is Live

Test in browser:
- https://aiprojecthub.vercel.app/api/cron/schedule-notifications
- Should return 401 Unauthorized (this is correct - means it's working)

If you get a different error, the endpoint might not be deployed.

## Quick Checklist

- [ ] CRON_SECRET in GitHub matches Vercel exactly
- [ ] VERCEL_APP_URL is `https://aiprojecthub.vercel.app` (no trailing slash)
- [ ] Both secrets are "Repository secrets" (not Environment secrets)
- [ ] Secrets are spelled correctly (case-sensitive)
- [ ] Vercel deployment is live and accessible
- [ ] Workflow file is committed to the repository

## After Fixing

1. Go to Actions: https://github.com/vipervv3/aiprojecthub/actions
2. Click "Notification Reminders" → "Run workflow"
3. Should show ✅ green checkmark!



