# 🔍 How to Verify Supabase Setup

## Quick Verification

### Option 1: Run SQL Script (Recommended)

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new

2. **Copy and paste** the contents of `VERIFY_SUPABASE_SETUP.sql`

3. **Click "Run"** (or press Ctrl+Enter)

4. **Check the results** - you'll see:
   - ✅ Green checkmarks for things that work
   - ❌ Red X's for things that need fixing
   - ⚠️  Warnings for potential issues

### Option 2: Use API Endpoint

After deploying to Vercel, visit:
```
https://aiprojecthub.vercel.app/api/verify-setup
```

This will return a JSON response with all verification results.

---

## What to Check

### 1. ✅ Storage Bucket is PUBLIC (CRITICAL!)

**The most important check:**
- Bucket name: `meeting-recordings`
- Must be **PUBLIC** (not private)
- If private, AssemblyAI cannot access recording files

**How to fix:**
1. Go to: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/storage/buckets
2. Click on `meeting-recordings` bucket
3. Click the gear icon (Settings)
4. Toggle "Public bucket" to **ON**
5. Click "Save"

### 2. ✅ Database Tables Exist

All required tables should exist:
- `users`
- `projects`
- `tasks`
- `recording_sessions`
- `meetings`
- `meeting_tasks`
- `ai_insights`
- `notifications`

### 3. ✅ Recording Sessions Schema

Check that `recording_sessions` table has:
- `transcription_status` column
- `transcription_text` column
- `transcription_confidence` column
- `ai_processed` column
- `file_path` column

### 4. ✅ Environment Variables

Verify these are set on Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ASSEMBLYAI_API_KEY`
- `GROQ_API_KEY`
- `NEXT_PUBLIC_APP_URL`

---

## Common Issues

### Issue 1: Bucket is Private
**Symptom:** Recordings stuck on "Transcribing..."  
**Fix:** Make bucket public (see above)

### Issue 2: Missing Columns
**Symptom:** Database errors  
**Fix:** Run `fix-recording-schema.sql` in Supabase SQL Editor

### Issue 3: Orphaned Recordings
**Symptom:** Recordings with no meetings  
**Fix:** Run `process-orphaned-recordings.sql` or they'll auto-process

---

**Status:** ✅ Verification tools ready

