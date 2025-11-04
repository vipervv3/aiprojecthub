# 🔧 Fix Calendar Sync - Complete Instructions

## ⚠️ The Problem

The synced events in your database have **incorrect times** from the old buggy parser. My code fixes are in place, but you need to **clear and re-sync** to get correct times.

## ✅ Solution: Clear and Re-Sync

### Step 1: Delete Synced Calendar

1. Go to http://localhost:3000/calendar
2. Click **"Sync"** button (purple button)
3. You should see your Outlook calendar listed
4. Click the **trash icon** (🗑️) next to your Outlook calendar
5. Confirm deletion
6. **This removes all the incorrectly-timed events**

### Step 2: Re-Add Your Calendar

1. Click **"Add Calendar Sync"**
2. Select **"Outlook/Microsoft 365"**
3. Enter your calendar name (e.g., "My Outlook Calendar")
4. Paste your ICS feed URL
5. Choose a color
6. Click **"Add Calendar"**

### Step 3: Wait for Sync

- The sync will take 30-60 seconds for 826 events
- You'll see a success message
- **With the fixed parser, times should now be correct!**

---

## 🔍 How to Verify It's Working

After re-syncing, check the browser console (F12) for these logs:

**Good logs to see:**
```
⚠️ TZID found: "Eastern Standard Time" for date 2025-11-3 13:0
→ Converting 13:0 EST/EDT to UTC by adding 5 hours
→ Result: Mon Nov 03 2025 1:00:00 PM (will display as 13:0 in Eastern)
```

This shows the parser is correctly converting Eastern times.

---

## 📊 Expected Result

After re-syncing with the fixed parser:

**Monday, Nov 3:**
- **9:00 AM** - "Focus time (excel and tabl...)" ✅
- **10:00 AM** - "Palace - FD Bi-weekly" ✅
- **1:00 PM** - Meeting that was showing at 8:00 AM ✅

All times should match your Outlook calendar exactly!

---

## 🚨 If Times Are Still Wrong After Re-Sync

If you re-sync and times are still incorrect, we need to see the raw ICS data. Do this:

1. Open browser console (F12)
2. Click "Sync" → Re-sync your calendar
3. Look for logs with "🔍 RAW ICS DATE"
4. Send me a screenshot of those logs

This will show me the exact format Outlook is using so I can fix the parser correctly.

---

## 🎯 The Fix

The parser now properly handles:

1. **UTC times** (with Z): `20251103T180000Z` → Converts to local time
2. **Eastern times** (with TZID): `TZID=Eastern:13:00` → Converts to UTC then to local
3. **All-day events**: `20251103` → Shows as all-day

---

## ⚡ Quick Fix (2 minutes)

1. Delete your synced Outlook calendar (trash icon)
2. Re-add it using the same ICS URL
3. Wait for sync to complete
4. Check Nov 3 at 1:00 PM - meeting should be there!

Your calendar will then match Outlook exactly! ✅

