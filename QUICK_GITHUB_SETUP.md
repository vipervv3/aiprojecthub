# 🚀 Quick GitHub Secrets Setup (2 Minutes!)

## Your Information Ready to Copy:

**Repository**: `vipervv3/aiprojecthub`  
**Vercel URL**: `https://aiprojecthub.vercel.app`

## Step-by-Step (Just Copy & Paste!)

### 1. Open GitHub Secrets Page
👉 **Click here**: https://github.com/vipervv3/aiprojecthub/settings/secrets/actions

### 2. Add CRON_SECRET

1. Click **"New repository secret"**
2. **Name**: `CRON_SECRET`
3. **Value**: Get it from Vercel:
   - Go to: https://vercel.com/dashboard
   - Click your `aiprojecthub` project
   - Go to **Settings** → **Environment Variables**
   - Find `CRON_SECRET` → Click the **👁️ eye icon** to reveal
   - **Copy the value** and paste it here
4. Click **"Add secret"**

### 3. Add VERCEL_APP_URL

1. Click **"New repository secret"** again
2. **Name**: `VERCEL_APP_URL`
3. **Value**: 
   ```
   https://aiprojecthub.vercel.app
   ```
4. Click **"Add secret"**

### 4. Test It! ✅

1. Go to: https://github.com/vipervv3/aiprojecthub/actions
2. Click **"Notification Reminders"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Watch it complete with ✅

## Done! 🎉

Your workflow will now run automatically **every hour** and send all reminders!

---

**Quick Links:**
- [GitHub Secrets](https://github.com/vipervv3/aiprojecthub/settings/secrets/actions)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/vipervv3/aiprojecthub/actions)



