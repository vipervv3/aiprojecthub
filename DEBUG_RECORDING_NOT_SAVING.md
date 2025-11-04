# Recording Not Saving - Debug Guide

## 🚨 Issue: Recording doesn't save

### Quick Checks:

1. **Open Browser Console (F12)**
   - Look for RED errors
   - Check what happens when you click "Stop Recording"
   - Copy any error messages you see

2. **Check Storage Bucket Exists**
   ```sql
   -- Run this in Supabase SQL Editor:
   SELECT * FROM storage.buckets WHERE name = 'recordings';
   ```
   - If empty/no results → Bucket doesn't exist (see fix below)

3. **Check if meetings are being created**
   ```sql
   -- Check recent meetings:
   SELECT id, title, created_at, user_id 
   FROM meetings 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

## 🔧 Most Common Causes:

### 1. Storage Bucket Missing ❌
**Symptom:** Error in console about "bucket not found"

**Fix:**
1. Go to Supabase Dashboard
2. Click **Storage** in sidebar
3. Click **New Bucket**
4. Name: `recordings`
5. Set to **Public**
6. Click **Create**

### 2. No User ID ❌
**Symptom:** Error about "user_id cannot be null"

**Fix:** Make sure you ran:
```sql
scripts/FINAL-FIX-delete-recordings.sql
```

### 3. Network/Permission Error ❌
**Symptom:** "Failed to upload" toast message

**Check:**
- Internet connection
- Supabase project is running
- API keys are valid

---

## 🧪 Step-by-Step Test:

### Try this minimal test:

1. **Open browser console (F12)** - keep it open
2. **Go to Meetings page**
3. **Click "Start Recording"**
4. **Select a project**
5. **Record for just 10 seconds**
6. **Click "Stop Recording"**
7. **Watch the console** - what errors appear?

---

## 📋 What to Check:

### In Browser Console:
Look for errors containing:
- ❌ "storage"
- ❌ "bucket"
- ❌ "user_id"
- ❌ "failed"
- ❌ "error"

### Expected Console Output (if working):
```
✅ Recording started
✅ Recording completed! Starting AI processing...
✅ Uploading recording...
✅ Recording uploaded! AI is generating title...
✅ AI is processing your recording...
```

---

## 🔍 Common Error Messages:

### Error: "Bucket not found"
```
storage.from('recordings') - bucket does not exist
```
**Fix:** Create the storage bucket (see above)

### Error: "violates not-null constraint"
```
null value in column "user_id" violates not-null constraint
```
**Fix:** Run FINAL-FIX-delete-recordings.sql script

### Error: "Failed to create meeting"
```
insert or update on table "meetings" violates foreign key
```
**Fix:** Check if projects table has your project

---

## 🛠️ Emergency Fix Script:

If nothing works, run this comprehensive check:

```sql
-- 1. Check if storage bucket exists
SELECT name, public FROM storage.buckets WHERE name = 'recordings';

-- 2. Check if user exists
SELECT id, email FROM auth.users WHERE id = auth.uid();

-- 3. Check if meetings table has user_id column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'meetings' AND column_name = 'user_id';

-- 4. Check if you have projects
SELECT id, name FROM projects WHERE owner_id = auth.uid();

-- 5. Check RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'meetings';
```

---

## 📊 Tell me:

Please provide:
1. **Console errors** (copy/paste the red errors)
2. **Results of storage bucket check** (does it exist?)
3. **What happens when you stop recording?** (toast messages)
4. **Did you create the storage bucket?** (yes/no)

This will help me identify the exact issue!







