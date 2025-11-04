# GitHub Actions Notification Setup

GitHub Actions is now configured to manage **all your automated reminders**! This includes:

- ✅ **Morning/Midday/Evening Notifications** - Timezone-aware intelligent notifications
- ✅ **Task Reminders** - Hourly, daily, and overdue task alerts
- ✅ **Automatic Hourly Execution** - Runs every hour to check all users' local times

## How It Works

The workflow (`.github/workflows/notifications.yml`) runs **every hour** and:
1. Calls `/api/cron/schedule-notifications` - Checks all users' local times and sends morning/midday/evening notifications
2. Calls `/api/cron/task-reminders` - Processes hourly, daily, and overdue task reminders

## Setup Instructions

### 1. Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

#### Required Secrets:

1. **`CRON_SECRET`**
   - Value: Your `CRON_SECRET` from Vercel environment variables
   - Same value as in your Vercel project settings

2. **`VERCEL_APP_URL`** (or `NEXT_PUBLIC_APP_URL`)
   - Value: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - Or use `NEXT_PUBLIC_APP_URL` if that's what you prefer

### 2. Verify Your Vercel Deployment URL

1. Go to your Vercel project dashboard
2. Copy your production deployment URL (e.g., `https://your-app.vercel.app`)
3. Add it as the `VERCEL_APP_URL` secret in GitHub

### 3. Test the Workflow

1. Go to **Actions** tab in your GitHub repository
2. Click **"Notification Reminders"** workflow
3. Click **"Run workflow"** → **"Run workflow"** (manual trigger)
4. Watch it execute and check the logs

### 4. Verify It's Working

After the first run, check:
- ✅ Workflow completes successfully (green checkmark)
- ✅ Both steps complete without errors
- ✅ Check your app logs in Vercel to see notification processing

## Schedule

- **Frequency**: Every hour (at minute 0)
- **Example times**: 00:00, 01:00, 02:00, 03:00, ... 23:00 UTC

## What Gets Triggered

### Every Hour:

1. **Notification Scheduler** (`/api/cron/schedule-notifications`)
   - Checks all users' local times
   - Sends morning notifications (default 8 AM local time)
   - Sends midday notifications (1 PM local time)
   - Sends evening notifications (6 PM local time)

2. **Task Reminders** (`/api/cron/task-reminders`)
   - Processes hourly task reminders
   - Processes daily task reminders
   - Processes overdue task alerts

## Troubleshooting

### Workflow Fails with 401 Unauthorized
- ✅ Verify `CRON_SECRET` in GitHub Secrets matches your Vercel `CRON_SECRET`
- ✅ Check that the secret is spelled correctly

### Workflow Fails with Connection Error
- ✅ Verify `VERCEL_APP_URL` is correct and your app is deployed
- ✅ Test the URL manually: `curl https://your-app.vercel.app/api/cron/schedule-notifications`

### Notifications Not Sending
- ✅ Check Vercel logs for the notification endpoints
- ✅ Verify user preferences in your database
- ✅ Check email service configuration (Resend API key)

### Workflow Runs But No Notifications Received
- ✅ Check user timezone settings in database
- ✅ Verify notification preferences are enabled
- ✅ Check Vercel logs for any errors during processing

## Manual Triggering

You can manually trigger the workflow anytime:
1. Go to **Actions** → **Notification Reminders**
2. Click **"Run workflow"**
3. Select branch and click **"Run workflow"**

## GitHub Actions Limits

- ✅ **Free tier**: 2,000 minutes/month for private repos
- ✅ **This workflow**: ~720 minutes/month (24 runs/day × 30 days = 720 runs)
- ✅ **Well within limits!** 🎉

## Next Steps

1. ✅ Add the required secrets to GitHub
2. ✅ Test the workflow manually
3. ✅ Monitor the first few automatic runs
4. ✅ Check that notifications are being received

Your reminders are now fully automated! 🚀

