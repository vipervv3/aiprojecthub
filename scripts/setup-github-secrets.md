# GitHub Secrets Setup Guide

## Quick Setup - Copy and Paste Ready!

Your GitHub repository: `https://github.com/vipervv3/aiprojecthub`

## Step 1: Get Your CRON_SECRET from Vercel

1. Go to: https://vercel.com/dashboard
2. Select your `aiprojecthub` project
3. Go to **Settings** → **Environment Variables**
4. Find `CRON_SECRET` and click the **eye icon** to reveal it
5. **Copy the value** (you'll need it in Step 3)

## Step 2: Get Your Vercel URL

Your Vercel production URL is:
```
https://aiprojecthub.vercel.app
```

## Step 3: Add Secrets to GitHub

1. Go to: https://github.com/vipervv3/aiprojecthub/settings/secrets/actions
2. Click **"New repository secret"**

### Secret 1: CRON_SECRET
- **Name**: `CRON_SECRET`
- **Value**: [Paste your CRON_SECRET from Vercel]
- Click **"Add secret"**

### Secret 2: VERCEL_APP_URL
- **Name**: `VERCEL_APP_URL`
- **Value**: `https://aiprojecthub.vercel.app`
- Click **"Add secret"**

## Step 4: Test the Workflow

1. Go to: https://github.com/vipervv3/aiprojecthub/actions
2. Click **"Notification Reminders"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Watch it execute - should complete with ✅

## Done! 🎉

The workflow will now run automatically every hour!



