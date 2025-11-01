# 🔔 External Cron Setup for Hourly Notifications

## ⚠️ Vercel Hobby Limitation

Vercel Hobby plan only allows **one cron job per day**. To receive **morning, midday, AND evening notifications**, you need to use an external cron service.

## ✅ Solution: Free External Cron Services

### Option 1: EasyCron (Recommended - Free Tier Available)

1. **Sign up:** https://www.easycron.com/
2. **Create a new cron job:**
   - **URL:** `https://your-app.vercel.app/api/cron/schedule-notifications`
   - **Schedule:** `0 * * * *` (every hour)
   - **HTTP Method:** GET
   - **Add Header:** `Authorization: Bearer YOUR_CRON_SECRET`
   - **Save**

3. **Get your CRON_SECRET:**
   - In Vercel, go to Environment Variables
   - Copy the `CRON_SECRET` value
   - Use it in the Authorization header

### Option 2: Cron-Job.org (Completely Free)

1. **Sign up:** https://cron-job.org/
2. **Create job:**
   - **Title:** AI ProjectHub Notifications
   - **URL:** `https://your-app.vercel.app/api/cron/schedule-notifications`
   - **Schedule:** Every hour
   - **Headers:** 
     - Key: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET`
   - **Save**

### Option 3: Zapier / Make.com (Paid but Powerful)

If you already use Zapier/Make, you can create an hourly webhook that calls the endpoint.

## 📋 Setup Instructions

### Step 1: Get Your App URL and Secret

1. Your app URL: `https://aiprojecthub-xxx.vercel.app` (check Vercel dashboard)
2. Your CRON_SECRET: Check Vercel Environment Variables → `CRON_SECRET`

### Step 2: Configure External Cron

Use this endpoint:
```
GET https://your-app.vercel.app/api/cron/schedule-notifications
Authorization: Bearer YOUR_CRON_SECRET
```

**Schedule:** Every hour (`0 * * * *`)

### Step 3: Test It

Visit the endpoint manually to test:
```
https://your-app.vercel.app/api/cron/schedule-notifications?Authorization=Bearer YOUR_CRON_SECRET
```

## ✅ What This Gives You

With hourly cron:
- ✅ **Morning notifications** - At your set time (default 8 AM)
- ✅ **Midday notifications** - At 1 PM your time
- ✅ **Evening notifications** - At 6 PM your time
- ✅ **Timezone-aware** - Automatically adjusts for each user

## 🧪 Alternative: Manual Testing

Until external cron is set up, you can manually trigger notifications:

```
GET /api/cron/test-notifications?userId=YOUR_USER_ID&period=morning
GET /api/cron/test-notifications?userId=YOUR_USER_ID&period=midday
GET /api/cron/test-notifications?userId=YOUR_USER_ID&period=evening
```

## 📝 Current Status

- ✅ Notification system ready
- ✅ Timezone checking working
- ⚠️ Need external cron for hourly checks (or upgrade Vercel to Pro)

---

**Recommendation:** Use EasyCron free tier - it's quick to set up and works reliably!

