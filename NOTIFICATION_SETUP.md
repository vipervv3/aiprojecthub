# 🔔 Notification Setup & Troubleshooting

## ✅ Automated Notifications Status

**Current Setup:** The notification system is ready and configured, but **Vercel Hobby plan only allows one cron job per day**.

**To receive ALL three notifications (morning, midday, evening):**
1. ✅ Use an external cron service (EasyCron, Cron-Job.org) - **Recommended**
2. ✅ Upgrade to Vercel Pro plan
3. ⚠️ Manual testing using `/api/cron/test-notifications`

See `EXTERNAL_CRON_SETUP.md` for easy setup instructions!

## 🕐 How It Works

The notification system:
1. **Runs once daily** at 8 AM UTC (due to Vercel Hobby limitation)
2. **Processes ALL users** and checks their local timezone
3. **Sends notifications** if it's the right time in their timezone:
   - **Morning:** Based on user's `morning_notification_time` preference (default 8:00 AM)
   - **Midday:** 1:00 PM local time
   - **Evening:** 6:00 PM local time

## ⚠️ Limitation

Since the cron only runs once per day at 8 AM UTC:
- Users in timezones where it's already past 8 AM local time when the cron runs will receive notifications
- Users in timezones where it's before 8 AM local time will receive notifications the next day

**Example:**
- If cron runs at 8 AM UTC (0:00 PST / 3:00 EST)
- A user in EST with 8 AM notification time: Will receive it at 3 AM EST (when cron runs)
- A user in PST with 8 AM notification time: Will receive it at 0:00 PST (when cron runs)

## 🧪 Testing Notifications

### Manual Test Endpoint

You can manually trigger notifications at any time:

```
GET /api/cron/test-notifications?userId=YOUR_USER_ID&period=morning
```

**Parameters:**
- `userId` (optional): Specific user ID to test
- `period` (optional): `morning`, `midday`, or `evening`

**Examples:**
```
# Test all users, all periods
/api/cron/test-notifications

# Test specific user, morning notification
/api/cron/test-notifications?userId=123&period=morning

# Test specific user, all periods
/api/cron/test-notifications?userId=123
```

### Check Notification Logs

1. Go to Vercel Dashboard
2. Navigate to your project
3. Click "Logs" tab
4. Look for notification-related logs:
   - `🔄 All notifications cron triggered`
   - `📧 Sending email to...`
   - `✅ Email sent successfully`

## 🔧 Improving Notification Delivery

### Option 1: Upgrade Vercel Plan
Upgrade to Vercel Pro to run cron jobs multiple times per day:
- Run at 8 AM, 1 PM, and 6 PM UTC
- Better timezone coverage
- More reliable delivery

### Option 2: External Cron Service
Use an external service like:
- **EasyCron** (free tier available)
- **Cron-Job.org** (free)
- **Zapier** (paid)

Configure to call: `https://your-app.vercel.app/api/cron/all-notifications`

### Option 3: Manual Trigger
Use the test endpoint to manually trigger when needed:
```
GET /api/cron/test-notifications
```

## 📊 Verify Notifications Are Working

1. **Check your notification preferences:**
   - Go to Settings → Notifications
   - Ensure "Email Notifications" and "Morning Notifications" are enabled
   - Check your timezone is set correctly

2. **Check your email:**
   - Look in spam folder
   - Verify email address in settings
   - Check Vercel logs for email sending errors

3. **Test manually:**
   - Visit `/api/cron/test-notifications?userId=YOUR_USER_ID&period=morning`
   - Check if you receive an email within a few minutes

## 🐛 Common Issues

### Not receiving notifications
- ✅ Check notification preferences are enabled
- ✅ Verify email address is correct
- ✅ Check timezone setting
- ✅ Check spam folder
- ✅ Verify cron job is running (check Vercel logs)

### Notifications arriving at wrong time
- ✅ Check timezone setting in Settings
- ✅ Remember: Cron runs at 8 AM UTC, adjusts for your timezone

### Test endpoint not working
- ✅ Ensure you're logged in
- ✅ Check Vercel logs for errors
- ✅ Verify CRON_SECRET if set (for manual calls)

## 📝 Current Configuration

- **Cron Schedule:** Once daily at 8 AM UTC
- **Email Service:** Resend (noreply@omarb.in)
- **Push Notifications:** Enabled (if subscribed)
- **In-App Notifications:** Always created

---

**Need help?** Check Vercel logs or test with the manual endpoint!

