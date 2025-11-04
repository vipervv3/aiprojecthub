# 🚀 RUN THE AUTOMATED FIX SCRIPT

## ✅ **This script will automatically fix everything!**

---

## 📋 **STEP 1: Make Sure You Have Dependencies**

Open PowerShell in your project folder and run:

```powershell
npm install @supabase/supabase-js dotenv
```

---

## 📋 **STEP 2: Check Your .env.local File**

Make sure you have these variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To get your Service Role Key:**
1. Go to Supabase Dashboard
2. Click your project
3. Go to **Settings** → **API**
4. Copy the **`service_role`** key (NOT the anon key!)
5. Paste it in `.env.local`

---

## 📋 **STEP 3: Run the Script**

In PowerShell:

```powershell
node fix-user-ids-auto.js
```

---

## 🎬 **WHAT THE SCRIPT DOES:**

### **Step 1: Find Users** 🔍
- Connects to your Supabase database
- Finds all users in the auth system
- Shows you the user IDs and emails

### **Step 2: Check Current Data** 📊
- Checks how many projects/recordings have the wrong user ID
- Shows you what needs to be updated

### **Step 3: Get Correct User ID** ✅
- Determines your REAL auth user ID
- Shows you which ID will be used

### **Step 4: Disable RLS** 🔓
- Temporarily turns off Row Level Security
- Allows updates to proceed

### **Step 5: Update All Data** 🔄
- Updates projects with correct user ID
- Updates recording_sessions with correct user ID
- Updates activity_log with correct user ID
- Updates notifications with correct user ID
- Updates ai_insights with correct user ID

### **Step 6: Verify** ✅
- Counts how many items were updated
- Shows you the results

### **Step 7: Re-enable RLS** 🔒
- Turns Row Level Security back ON
- Your data is now protected!

---

## ⏱️ **TIMING:**

The script has a **5-second delay** before making changes.

This gives you time to:
- Read what it's about to do
- Press **Ctrl+C** to cancel if needed

**If you don't cancel, it will proceed automatically!**

---

## ✅ **EXPECTED OUTPUT:**

```
========================================
🔧 AUTOMATIC USER ID FIX
========================================

✅ Connecting to Supabase...

📋 STEP 1: Finding users in auth system...
✅ Found 2 user(s):
  1. you@example.com - abc-123-def-456
  2. other@example.com - xyz-789-ghi-012

📋 STEP 2: Finding user IDs in your data...
📊 Data with old user ID:
  - Projects: 5
  - Recordings: 3
  - Activities: 12

📋 STEP 3: Determining correct user ID...
✅ Using user ID: abc-123-def-456
   Email: you@example.com

⚠️  IMPORTANT: This will update ALL data!
Press Ctrl+C to cancel, or wait 5 seconds to continue...

📋 STEP 4: Temporarily disabling RLS...
  ✅ Disabled RLS on projects
  ✅ Disabled RLS on recording_sessions
  ✅ Disabled RLS on tasks
  ...

📋 STEP 5: Updating all data with correct user ID...
  ✅ Updated projects
  ✅ Updated recording sessions
  ✅ Updated activity log
  ...

📋 STEP 6: Verifying updates...
📊 Data with correct user ID:
  - Projects: 5
  - Recordings: 3
  - Tasks: 15

📋 STEP 7: Re-enabling RLS...
  ✅ Enabled RLS on projects
  ✅ Enabled RLS on recording_sessions
  ...

========================================
✅ FIX COMPLETE!
========================================

📋 Next steps:
  1. Refresh your app (Ctrl+F5)
  2. Check if you can see your projects/tasks
  3. Login as another user
  4. Verify they see ZERO of your data
```

---

## 🧪 **AFTER RUNNING:**

### **Test 1: YOUR Account**
1. Refresh your app (Ctrl+F5)
2. Go to Projects page
3. **Should see:** All your projects ✅
4. Go to Tasks page
5. **Should see:** All your tasks ✅

### **Test 2: OTHER User**
1. Logout
2. Login as another user
3. Go to Projects page
4. **Should see:** ZERO projects ✅
5. Go to Meetings page
6. **Should see:** ZERO recordings ✅

---

## ⚠️ **IF SOMETHING GOES WRONG:**

The script is safe because:
- It only updates data (doesn't delete anything)
- Supabase keeps automatic backups
- You can restore from backup if needed

**If you see errors:**
- Copy the full error message
- Let me know what happened
- I'll help troubleshoot!

---

## 📋 **CHECKLIST:**

- [ ] Installed dependencies: `@supabase/supabase-js` and `dotenv`
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- [ ] Ran: `node fix-user-ids-auto.js`
- [ ] Script completed successfully
- [ ] Refreshed app
- [ ] Can see my projects/tasks ✅
- [ ] Tested with other user
- [ ] Other user sees ZERO of my data ✅

---

## 🎉 **DONE!**

Your data is now properly secured and RLS is working correctly!

---

**Run the script now:** `node fix-user-ids-auto.js` 🚀

