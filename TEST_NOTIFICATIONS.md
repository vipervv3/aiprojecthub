# 🧪 Test Your Intelligent Notifications

## Quick Test Guide

### **Option 1: Test Locally (Recommended First)**

```bash
# 1. Start your dev server
npm run dev

# 2. In another terminal, test morning notification
curl -X GET \
  -H "Authorization: Bearer your_cron_secret_from_env" \
  http://localhost:3000/api/cron/morning-notifications

# 3. Test midday notification
curl -X GET \
  -H "Authorization: Bearer your_cron_secret_from_env" \
  http://localhost:3000/api/cron/midday-notifications

# 4. Test evening notification
curl -X GET \
  -H "Authorization: Bearer your_cron_secret_from_env" \
  http://localhost:3000/api/cron/evening-notifications
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Morning notifications sent",
  "timestamp": "2025-01-30T12:34:56.789Z"
}
```

**Check:**
- ✅ Your email inbox (should receive email)
- ✅ Console logs (shows processing)
- ✅ Resend dashboard (shows email sent)

---

### **Option 2: Test Without Cron (Create Test Route)**

Create: `app/api/test-notification/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { intelligentAssistant } from '@/lib/notifications/intelligent-assistant-service'

export async function GET(request: NextRequest) {
  try {
    // Get your user ID from query params
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Test morning notification for your user
    await intelligentAssistant.sendIntelligentNotification(userId, 'morning')

    return NextResponse.json({ 
      success: true, 
      message: 'Test notification sent! Check your email.'
    })
  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

**Then visit:**
```
http://localhost:3000/api/test-notification?userId=your-user-id-here
```

---

### **Option 3: Test in Browser DevTools**

```javascript
// Open your app in browser, open DevTools console, run:
fetch('/api/cron/morning-notifications', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your_cron_secret_here'
  }
})
.then(r => r.json())
.then(data => console.log('Result:', data))
.catch(err => console.error('Error:', err))
```

---

### **Option 4: Test with Postman/Insomnia**

**Request:**
- Method: `GET`
- URL: `http://localhost:3000/api/cron/morning-notifications`
- Headers:
  - `Authorization`: `Bearer your_cron_secret_here`

**Click Send** → Should get success response + receive email

---

## 📧 Check Email Delivery

### **Resend Dashboard:**
1. Go to https://resend.com/logs
2. Look for recent emails
3. Check status: ✅ Delivered or ❌ Failed
4. Click on email to see full details

### **Your Inbox:**
- Check inbox for email from "AI ProjectHub"
- Subject: "Good morning, [Your Name]! 🤖 Your morning update"
- Beautiful HTML email with your tasks

---

## 🐛 Common Issues

### **"Unauthorized" Error**
```json
{ "error": "Unauthorized" }
```
**Fix:** Check your `Authorization` header matches `CRON_SECRET` in `.env.local`

---

### **"No users found"**
```
Console: "No users found"
```
**Fix:** Make sure you have a user in the `users` table with `notification_preferences` enabled

---

### **Email not received**
**Checklist:**
1. ✅ Check spam folder
2. ✅ Verify email in Resend logs (https://resend.com/logs)
3. ✅ Check `RESEND_API_KEY` is correct
4. ✅ For free tier, verify your email in Resend settings
5. ✅ Check console logs for errors

---

### **AI message not personalized**
If you get generic fallback message instead of AI-generated:
1. ✅ Check `GROQ_API_KEY` is correct
2. ✅ Check Groq API quota (https://console.groq.com)
3. ✅ Check console logs for Groq errors
4. ✅ Fallback is OK for testing, but AI is better

---

## 🎯 What to Verify

### **Email Content Checklist:**
- ✅ Correct greeting (Good morning/afternoon/evening)
- ✅ Your name appears
- ✅ Shows your actual projects
- ✅ Shows your actual tasks
- ✅ Shows your actual meetings (if any)
- ✅ AI message is personalized (not generic)
- ✅ Metrics are accurate
- ✅ "Open AI ProjectHub" button works
- ✅ Email looks good on mobile

### **Database Checklist:**
After sending, check your `notifications` table:
```sql
SELECT * FROM notifications 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 5;
```
Should see new notification entry with:
- ✅ Correct `type` (morning_notification, smart_alert, daily_summary)
- ✅ AI-generated message
- ✅ `sent_at` timestamp
- ✅ Metadata with period info

---

## 🚀 Ready for Production?

If all tests pass:
1. ✅ Local test works
2. ✅ Email received and looks good
3. ✅ AI message is personalized
4. ✅ In-app notification created
5. ✅ No errors in console

**Deploy to Vercel:**
```bash
vercel --prod
```

Then Vercel cron will run automatically at:
- 8:00 AM UTC (morning)
- 1:00 PM UTC (midday)
- 6:00 PM UTC (evening)

---

## 🕐 Testing Cron in Production

### **Trigger Manually (Vercel Dashboard):**
1. Go to Vercel dashboard
2. Select your project
3. Click "Cron Jobs" in sidebar
4. Click "Run" button next to a job
5. Check logs

### **Wait for Scheduled Time:**
- Cron runs automatically at scheduled times
- Check Vercel logs at scheduled time
- Check your email inbox

---

## 💡 Pro Tips

### **Test with Different Users:**
Create test users with different:
- Number of tasks (0, 1, 5, 20)
- Task priorities (urgent, high, medium, low)
- Projects (0, 1, multiple)
- Meetings (none, one, multiple)

AI will generate different messages for each!

### **Test All Three Periods:**
Test morning, midday, and evening to see:
- Different greetings
- Different tones (motivating, check-in, reflective)
- Different color schemes (blue, orange, purple)
- Evening shows "completed today" count

---

## ✅ Success!

If you received an email with:
- 🤖 Your name
- 📊 Your actual tasks
- 🎨 Beautiful design
- 💬 Personalized AI message

**Congratulations! Your intelligent notification system is working!** 🎉

Now users will automatically receive these 3x per day!





