# 🔧 FIX USER ID MISMATCH - STEP BY STEP

## 🚨 THE PROBLEM:
Your login user ID doesn't match the user IDs stored in your data!

**This causes:**
- ❌ You can't see your own projects/tasks
- ❌ Other users CAN see your recordings
- ❌ RLS is blocking YOU but not others

---

## ✅ THE FIX (10 minutes):

### **STEP 1: Open Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

---

### **STEP 2: Run STEP 1 from the SQL Script**

Open the file: **`fix-user-id-mismatch.sql`**

**Copy ONLY the STEP 1 query:**
```sql
SELECT 
  id as user_id,
  email,
  created_at,
  CASE 
    WHEN created_at = (SELECT MIN(created_at) FROM auth.users) THEN '← YOUR ACCOUNT (oldest)'
    ELSE ''
  END as note
FROM auth.users
ORDER BY created_at ASC;
```

**Paste it in SQL Editor and click "Run"**

**Look at the results:**
- Find YOUR email address
- Copy the `user_id` (UUID) next to it
- Example: `abc-123-def-456-789`

**Write it down!** You'll need it in the next step.

---

### **STEP 3: Edit the SQL Script**

In the file `fix-user-id-mismatch.sql`, find ALL places that say:
```
'YOUR_REAL_USER_ID_HERE'
```

**Replace ALL of them** with your actual user ID from Step 2.

**Example:**
If your user ID is `abc-123-def-456`, change:
```sql
UPDATE projects 
SET owner_id = 'YOUR_REAL_USER_ID_HERE'
```

To:
```sql
UPDATE projects 
SET owner_id = 'abc-123-def-456'
```

**Do this for ALL occurrences!** (There are about 8-10 places)

---

### **STEP 4: Run the ENTIRE Script**

1. **Copy the ENTIRE edited SQL script**
2. **Paste it into Supabase SQL Editor**
3. **Click "Run"** (or Ctrl+Enter)
4. **Wait for it to complete** (~10-15 seconds)

**You should see multiple result tables showing:**
- How many projects were updated
- How many recordings were updated
- How many tasks are accessible
- Etc.

---

### **STEP 5: Test in Your App**

1. **Refresh your app** (Ctrl+F5 or hard refresh)
2. **Check Projects page** - Should see your projects now ✅
3. **Check Tasks page** - Should see your tasks now ✅
4. **Check Meetings page** - Should see your recordings ✅

---

### **STEP 6: Test with Other User**

1. **Logout** from your account
2. **Login as the OTHER user** (the one who could see your data)
3. **Check Meetings page** - Should see ZERO recordings now ✅
4. **Check Projects page** - Should see ZERO projects now ✅

---

## ✅ EXPECTED RESULTS:

### **After Running the Script:**

| What | Before | After |
|------|--------|-------|
| **You see your projects** | ❌ No | ✅ Yes |
| **You see your tasks** | ❌ No | ✅ Yes |
| **You see your recordings** | ✅ Yes | ✅ Yes |
| **Other user sees your data** | ❌ Yes | ✅ No |

---

## ⚠️ IMPORTANT NOTES:

### **The Old User ID:**
`0d29164e-53f6-4a05-a070-e8cae3f7ec31`

This ID was somehow created/used but it's not your actual auth user ID.

### **Why This Happened:**
Possibly:
- Demo data was created with a fixed UUID
- Initial setup used a placeholder ID
- Database was populated before proper auth setup

### **The Fix:**
We're updating ALL your data to use your REAL auth user ID, so RLS works correctly.

---

## 🧪 VERIFICATION QUERIES:

After running the script, you can verify with these:

### **Check if your data has the correct user ID:**
```sql
SELECT 
  (SELECT COUNT(*) FROM projects WHERE owner_id = 'YOUR_REAL_USER_ID') as my_projects,
  (SELECT COUNT(*) FROM recording_sessions WHERE user_id = 'YOUR_REAL_USER_ID') as my_recordings,
  (SELECT COUNT(*) FROM activity_log WHERE user_id = 'YOUR_REAL_USER_ID') as my_activities;
```

### **Check if old ID is gone:**
```sql
SELECT 
  (SELECT COUNT(*) FROM projects WHERE owner_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31') as old_projects,
  (SELECT COUNT(*) FROM recording_sessions WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31') as old_recordings;
```

**Should show 0 for both!**

---

## 🔧 IF SOMETHING GOES WRONG:

### **Restore from Backup:**
Supabase keeps automatic backups. You can restore if needed.

### **Contact Support:**
If the script fails or you get errors, let me know the exact error message!

---

## 📋 CHECKLIST:

- [ ] Opened Supabase SQL Editor
- [ ] Ran STEP 1 query to find my real user ID
- [ ] Copied my real user ID
- [ ] Edited the SQL script (replaced 'YOUR_REAL_USER_ID_HERE')
- [ ] Ran the entire edited script
- [ ] Saw success messages
- [ ] Refreshed my app
- [ ] Can now see my projects/tasks ✅
- [ ] Tested with other user
- [ ] Other user sees ZERO of my data ✅

---

## 🎉 AFTER THIS IS DONE:

**Your data will be fully secure!**

- ✅ You can see YOUR data
- ✅ Others CANNOT see your data
- ✅ RLS is working correctly
- ✅ All data properly isolated

---

**Run the script and let me know how it goes!** 🚀

