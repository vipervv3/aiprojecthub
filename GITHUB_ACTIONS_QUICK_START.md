# 🚀 GitHub Actions Quick Start

## ⚡ 3-Step Setup (2 minutes)

### Step 1: Add GitHub Secrets

Go to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these **2 secrets**:

1. **`CRON_SECRET`**
   ```
   Value: [Same as your Vercel CRON_SECRET]
   ```

2. **`VERCEL_APP_URL`** (or `NEXT_PUBLIC_APP_URL`)
   ```
   Value: https://your-app.vercel.app
   ```
   *(Replace with your actual Vercel deployment URL)*

### Step 2: Push to GitHub

The workflow file (`.github/workflows/notifications.yml`) is already created. Just push:

```bash
git add .github/workflows/notifications.yml
git commit -m "Add GitHub Actions for notifications"
git push
```

### Step 3: Test It

1. Go to **Actions** tab in GitHub
2. Click **"Notification Reminders"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Watch it run! ✅

---

## ✅ That's It!

Your reminders now run **automatically every hour**:
- Morning/Midday/Evening notifications (timezone-aware)
- Task reminders (hourly, daily, overdue)

## 📊 Monitor It

- **GitHub Actions**: Check the **Actions** tab for run history
- **Vercel Logs**: Check your Vercel dashboard for notification processing logs

## 🆘 Need Help?

See `GITHUB_ACTIONS_SETUP.md` for detailed troubleshooting.

