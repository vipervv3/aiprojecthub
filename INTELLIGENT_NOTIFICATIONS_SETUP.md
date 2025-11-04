# 🤖 Intelligent Notifications System - Setup Guide

## ✅ What Was Created

Your AI assistant notification system is now implemented! Here's what you have:

### **Files Created:**
1. ✅ `lib/notifications/intelligent-assistant-service.ts` - AI notification engine
2. ✅ `app/api/cron/morning-notifications/route.ts` - 8 AM notifications
3. ✅ `app/api/cron/midday-notifications/route.ts` - 1 PM check-ins
4. ✅ `app/api/cron/evening-notifications/route.ts` - 6 PM wrap-ups
5. ✅ `vercel.json` - Automatic cron scheduling

---

## 🚀 Setup Instructions

### **Step 1: Environment Variables**

Add these to your `.env.local` file:

```bash
# Cron Job Security (generate a random string)
CRON_SECRET=your_random_secret_here_xyz123abc456

# Make sure these exist (you should already have them)
GROQ_API_KEY=your_groq_api_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

**Generate a strong CRON_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

### **Step 2: Get Resend API Key (if you don't have it)**

1. Go to https://resend.com
2. Sign up (FREE tier: 100 emails/day, 3,000/month)
3. Verify your email
4. Go to API Keys section
5. Create new API key
6. Copy it to `.env.local` as `RESEND_API_KEY`

**Important:** For production, verify your domain in Resend settings!

---

### **Step 3: Test Locally**

Before deploying, test the endpoints work:

```bash
# Start your dev server
npm run dev

# Test morning notification (in another terminal)
curl -H "Authorization: Bearer your_cron_secret_here" \
  http://localhost:3000/api/cron/morning-notifications

# Test midday notification
curl -H "Authorization: Bearer your_cron_secret_here" \
  http://localhost:3000/api/cron/midday-notifications

# Test evening notification
curl -H "Authorization: Bearer your_cron_secret_here" \
  http://localhost:3000/api/cron/evening-notifications
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Morning notifications sent",
  "timestamp": "2025-01-30T08:00:00.000Z"
}
```

---

### **Step 4: Deploy to Vercel**

```bash
# Deploy to production
vercel --prod

# Or push to main branch (if auto-deploy is enabled)
git add .
git commit -m "Add intelligent notification system"
git push origin main
```

**Vercel will automatically:**
- ✅ Read `vercel.json`
- ✅ Set up 3 cron jobs
- ✅ Run them at scheduled times

---

### **Step 5: Add Environment Variables to Vercel**

In Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add:
   - `CRON_SECRET` = your_random_secret
   - `RESEND_API_KEY` = your_resend_key
   - `GROQ_API_KEY` = your_groq_key
   - `NEXT_PUBLIC_APP_URL` = https://your-domain.com

---

## 📋 Cron Schedule

The system sends notifications at:

| Time | Period | Cron | Content |
|------|--------|------|---------|
| 8:00 AM | Morning | `0 8 * * *` | Day planning, urgent tasks, motivation |
| 1:00 PM | Midday | `0 13 * * *` | Progress check, afternoon priorities |
| 6:00 PM | Evening | `0 18 * * *` | Day review, tomorrow preparation |

**All times are in UTC.** To adjust for your timezone:
- PST (UTC-8): Morning = `0 16 * * *` (4 PM UTC = 8 AM PST)
- EST (UTC-5): Morning = `0 13 * * *` (1 PM UTC = 8 AM EST)
- CET (UTC+1): Morning = `0 7 * * *` (7 AM UTC = 8 AM CET)

---

## 🧪 Manual Testing (Vercel Production)

After deploying, test the production endpoints:

```bash
# Replace with your actual domain and CRON_SECRET
curl -H "Authorization: Bearer your_cron_secret" \
  https://your-domain.com/api/cron/morning-notifications
```

---

## 📧 What Users Will Receive

### **Morning Email (8 AM)** ☀️
```
Subject: Good morning, John! 🤖 Your morning update

Content:
- 🤖 AI-generated personalized message
- 📊 Dashboard metrics (projects, tasks, meetings)
- 🎯 Priority tasks (urgent + high priority)
- 📅 Today's meetings
- 💡 Recent AI insights
- Call-to-action button → Dashboard
```

### **Midday Email (1 PM)** ⚡
```
Subject: Good afternoon, John! ⚡ Your midday check-in

Content:
- 🤖 Progress check message
- 📊 Updated metrics (includes completed tasks)
- 🎯 Remaining priority tasks
- 💡 Suggestions for afternoon
- Call-to-action button → Dashboard
```

### **Evening Email (6 PM)** 🌙
```
Subject: Good evening, John! 🌙 Your evening wrap-up

Content:
- 🤖 Reflection on day's accomplishments
- 📊 Daily summary (what was completed)
- 🎯 Tomorrow's upcoming tasks
- 💡 Light preparation suggestions
- Call-to-action button → Dashboard
```

---

## 🎨 Email Features

### **Beautiful Design:**
- ✅ Responsive (looks great on mobile)
- ✅ Color-coded by time (blue=morning, orange=midday, purple=evening)
- ✅ Priority badges (urgent, high, medium, low)
- ✅ Professional gradient headers
- ✅ Easy-to-scan layout

### **Smart Content:**
- ✅ AI analyzes user's actual tasks/projects
- ✅ Personalized recommendations
- ✅ Contextual to time of day
- ✅ References real data (no generic messages)

---

## 🔧 User Preferences

Users can control notifications in Settings:

The system checks `notification_preferences` in the `users` table:
```json
{
  "email_daily_summary": true,
  "morning_notifications": true,
  "push_notifications": false
}
```

If **either** `email_daily_summary` or `morning_notifications` is `true`, user receives emails.

---

## 🐛 Troubleshooting

### **Issue: "Unauthorized" error**
**Solution:** Make sure `CRON_SECRET` matches in `.env.local` and request header

### **Issue: Emails not sending**
**Checklist:**
- ✅ `RESEND_API_KEY` is valid
- ✅ Email is verified in Resend (for free tier)
- ✅ Check Resend logs at https://resend.com/logs
- ✅ Check Vercel function logs

### **Issue: No AI message generated**
**Checklist:**
- ✅ `GROQ_API_KEY` is valid
- ✅ Check Groq API quota at https://console.groq.com
- ✅ Fallback message should still send

### **Issue: Cron jobs not running**
**Checklist:**
- ✅ `vercel.json` is in root directory
- ✅ Deployed to Vercel (cron only works in production)
- ✅ Check Vercel → Project → Cron Jobs section
- ✅ Wait for scheduled time (or trigger manually)

---

## 📊 Monitoring

### **Check Cron Job Logs (Vercel):**
1. Go to Vercel dashboard
2. Select your project
3. Click "Cron Jobs" in sidebar
4. View execution history

### **Check Email Delivery (Resend):**
1. Go to https://resend.com/logs
2. View sent emails
3. Check delivery status

### **Check Function Logs (Vercel):**
1. Go to Vercel dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by function name

---

## 🎯 Success Metrics

Your notification system is working if:
- ✅ Cron jobs show "Success" in Vercel
- ✅ Emails appear in Resend logs
- ✅ Users receive emails at scheduled times
- ✅ In-app notifications are created in database
- ✅ AI messages are personalized (not fallbacks)

---

## 🚀 Next Steps

### **Optional Enhancements:**

1. **Add SMS notifications** (Twilio)
2. **Push notifications** (Firebase Cloud Messaging)
3. **User timezone support** (send at user's local 8 AM)
4. **Custom schedules per user**
5. **Weekly/monthly reports**
6. **Notification preferences UI** (already exists in settings)

---

## 📖 Code Overview

### **Main Service:**
`lib/notifications/intelligent-assistant-service.ts`

**Key Methods:**
- `sendIntelligentNotification(userId, period)` - Send notification to one user
- `processNotificationsForPeriod(period)` - Process all users
- `generateAssistantMessage(period, userData)` - AI message generation
- `generateIntelligentEmailHTML(...)` - Beautiful email template

### **API Routes:**
Each route (`/api/cron/*-notifications/route.ts`):
1. Validates `CRON_SECRET`
2. Calls `intelligentAssistant.processNotificationsForPeriod(period)`
3. Returns success/error response

### **Vercel Cron:**
`vercel.json` defines 3 cron jobs that hit the API routes automatically.

---

## 🎉 You're Done!

Your users will now receive:
- ☀️ Morning motivation at 8 AM
- ⚡ Midday check-in at 1 PM
- 🌙 Evening wrap-up at 6 PM

**All powered by AI and personalized to their actual work!**

---

## 🆘 Need Help?

If you encounter issues:
1. Check this troubleshooting guide
2. Review Vercel logs
3. Review Resend logs
4. Test endpoints manually with curl
5. Verify all environment variables are set

**Common Quick Fix:**
```bash
# Redeploy to ensure everything is updated
vercel --prod --force
```







