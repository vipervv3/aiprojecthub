# 🚀 Setup Recording System NOW (2 Minutes)

**Your recording didn't save because the storage bucket doesn't exist yet.**

**Follow these 2 simple steps:**

---

## Step 1: Run SQL (1 minute)

### Go to Supabase SQL Editor:
**Direct link:** https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new

### Copy this entire file and paste it:
**File:** `scripts/FINAL_RECORDING_SETUP.sql`

### Click "Run" button (bottom-right)

**Expected:** ✅ Success message

**What this does:**
- Creates storage bucket for audio files
- Adds columns to recording_sessions table
- Creates meeting_tasks table
- Sets up indexes

---

## Step 2: Verify Bucket Created (30 seconds)

### Go to Supabase Storage:
**Direct link:** https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/storage/buckets

### Check: Do you see "meeting-recordings" bucket?

**If YES:** ✅ Perfect! You're done!

**If NO:** Create it manually:
1. Click "New bucket"
2. Name: `meeting-recordings`
3. Public: **UNCHECK**
4. File size: 500 MB
5. Click "Create"

---

## ✅ That's It!

After these 2 steps:

1. **Refresh your app:** http://localhost:3001
2. **Click floating button** (red microphone, bottom-right)
3. **Select a project**
4. **Start recording**
5. **Look for:** "• 1 chunks saved to cloud" (after 10 seconds)

**This time it will work!** 🎉

---

## 🔍 Why It Failed Before

**Problem:** No storage bucket existed  
**Result:** Uploads failed silently  
**Fix:** Run the SQL above to create it  

---

## 📋 Quick Links

**SQL Editor:** https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new

**Storage:** https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/storage/buckets

**SQL File:** `scripts/FINAL_RECORDING_SETUP.sql`

---

**After setup, your recordings will:**
- ✅ Upload chunks every 10 seconds
- ✅ Show on meetings page
- ✅ Generate AI titles
- ✅ Extract tasks automatically
- ✅ Link to selected project

**Total time:** 2 minutes to set up, then test recording! 🎙️




