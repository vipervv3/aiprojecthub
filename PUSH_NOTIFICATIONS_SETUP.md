# 🔔 Web Push Notifications Setup Guide

## ✅ What's Implemented

1. ✅ Service Worker (`public/sw.js`) - Handles push notifications
2. ✅ Push Notification Service - Sends notifications
3. ✅ API Routes - Subscribe/unsubscribe endpoints
4. ✅ React Hook (`usePushNotifications`) - Client-side management
5. ✅ Settings UI - Toggle push notifications
6. ✅ Integration with notification system - Sends push with emails

## 📋 Required Setup Steps

### Step 1: Generate VAPID Keys

VAPID keys are required for web push notifications. Run:

```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: <your-public-key>
Private Key: <your-private-key>
```

### Step 2: Add VAPID Keys to Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:admin@aiprojecthub.com
```

Add to **Vercel Environment Variables**:
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same as .env.local)
   - `VAPID_PRIVATE_KEY` (same as .env.local)
   - `VAPID_SUBJECT` (your email or app URL)

### Step 3: Create Push Subscriptions Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Push Subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endpoint, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
```

Or use the provided script:
```bash
# The SQL is in scripts/add-push-subscriptions-table.sql
```

### Step 4: Create App Icons (Optional but Recommended)

Create two icon files in `public/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

These are referenced in:
- `public/manifest.json`
- Service worker notifications

### Step 5: Test Push Notifications

1. **Enable in Settings:**
   - Go to Settings → Notifications
   - Toggle "Push Notifications" ON
   - Grant browser permission when prompted

2. **Test Notification:**
   - Use the test endpoint: `/api/test/notifications?type=morning&push=true`
   - Or wait for scheduled notifications

## 🌍 Platform Support

### ✅ Fully Supported:
- **Android Chrome** - Full support
- **Desktop Chrome** - Full support
- **Desktop Firefox** - Full support
- **Desktop Safari** - Full support
- **iOS Safari 16.4+** - Works if user adds to Home Screen as PWA

### ⚠️ Limitations:
- **iOS Safari < 16.4** - Not supported (need native app)
- **Safari on macOS** - Requires user interaction to request permission

## 📱 iOS Setup (PWA)

For iOS users to receive push notifications:

1. **User must have iOS 16.4 or later**
2. **Add to Home Screen:**
   - Open Safari on iPhone
   - Visit your website
   - Tap Share button
   - Select "Add to Home Screen"
   - Tap "Add"
3. **Open from Home Screen** (not Safari)
4. **Grant notification permission** when prompted

## 🔧 How It Works

1. **User subscribes** via Settings page
2. **Service worker** registers in browser
3. **Subscription** saved to database
4. **Notifications sent** via push notification service
5. **Service worker** receives and displays notification

## 🧪 Testing

### Manual Test:
```bash
# In browser console:
fetch('/api/test/notifications?type=morning&userId=YOUR_USER_ID')
```

### Check Subscription:
```sql
SELECT * FROM push_subscriptions WHERE user_id = 'YOUR_USER_ID';
```

### Send Test Push:
The notification system automatically sends push notifications when:
- Morning notifications are sent (if enabled)
- Midday notifications are sent (if enabled)
- Evening notifications are sent (if enabled)

## 🐛 Troubleshooting

### "Push notifications are not supported"
- Browser doesn't support push notifications
- Use Chrome, Firefox, or Safari 16.4+

### "VAPID key not loaded"
- Check environment variables are set
- Restart dev server after adding env vars
- Check Vercel env vars are set

### "Service worker registration failed"
- Check `public/sw.js` exists
- Check browser console for errors
- Ensure HTTPS (required for service workers)

### Notifications not appearing
- Check browser notification permissions
- Check service worker is registered (DevTools → Application → Service Workers)
- Check subscription exists in database
- Check VAPID keys are correct

## 📝 Next Steps

1. Generate and add VAPID keys
2. Create push_subscriptions table
3. Test push notifications
4. Monitor subscription rates
5. Consider native iOS app for full coverage

## 🎯 Production Checklist

- [ ] VAPID keys generated and added to Vercel
- [ ] Push subscriptions table created
- [ ] App icons created and added
- [ ] Service worker tested on all platforms
- [ ] Notification permissions tested
- [ ] iOS PWA installation tested
- [ ] Push notifications working end-to-end

