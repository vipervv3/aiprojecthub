# 🔧 FIX EXISTING RECORDINGS

## Problem
Your existing recordings can't show details/transcript/summary because the `recording_session_id` link is broken.

## Solution
Run this SQL script in Supabase to fix all existing recordings.

---

## Step-by-Step Instructions:

### 1️⃣ Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project: `aiprojecthub`
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

### 2️⃣ Copy the SQL Script
1. Open the file: `fix-existing-recordings.sql`
2. Copy **ALL** the content (Ctrl+A, Ctrl+C)

### 3️⃣ Paste and Run
1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press F5)
3. You should see results showing:
   - Which meetings were found broken
   - How many were updated
   - Verification that they're now fixed

### 4️⃣ Verify the Fix
1. Go back to your app: https://aiprojecthub.vercel.app/meetings
2. Click **Details** on any recording
3. You should now see:
   - ✅ Summary tab (meeting summary and action items)
   - ✅ Transcript tab (full transcription)
   - ✅ Tasks tab (AI-generated tasks)

---

## What This Does:

**Before:**
```
Meeting ──❌──X  Recording Session
(No link)         (Has transcript)
```

**After:**
```
Meeting ──✅──→  Recording Session
(Linked!)         (Can load transcript!)
```

---

## If You See Errors:

### Error: "permission denied for table meetings"
- This means you need to use a query that respects RLS
- The script already accounts for this
- Make sure you're logged in as the owner

### Error: "column recording_session_id does not exist"
- This means your database schema is out of sync
- You may need to run the schema migration first

### No meetings show up in Step 1
- This means all your meetings are already properly linked!
- No fix needed, your recordings should work

---

## Expected Output:

```sql
-- Step 1: Shows broken meetings
meeting_id | title              | recording_session_id | actual_session_id | ...
-----------|--------------------|--------------------- |-------------------|
abc-123    | Recording 11/2...  | NULL                 | xyz-789           | ...
def-456    | Recording 11/2...  | NULL                 | uvw-012           | ...

-- Step 2: Update command
UPDATE 4  -- "4 meetings were fixed"

-- Step 3: Verification
meeting_id | title              | linked_session_id | status
-----------|--------------------| ------------------|-------------
abc-123    | Recording 11/2...  | xyz-789           | ✅ FIXED
def-456    | Recording 11/2...  | uvw-012           | ✅ FIXED
```

---

## After Running This:

### ✅ **New Recordings** (from now on)
- Will automatically have proper linkage
- Will work immediately after recording

### ✅ **Old Recordings** (the ones you already have)
- Will now be properly linked
- Details page will load transcript/summary
- AI-generated titles will be visible (if processing completed)

---

## Still Having Issues?

If after running this script the details page still doesn't work:

1. **Check console logs** (F12 → Console tab)
2. **Verify AI processing completed** - Old recordings might not have been transcribed yet
3. **Try a new recording** - Record a short test to verify the fix works for new recordings

---

**Ready?** Open Supabase SQL Editor and run the script! 🚀




