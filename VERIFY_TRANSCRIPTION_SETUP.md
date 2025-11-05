# 🔍 Verify Transcription Setup

## Issue: Recordings Stuck on "Transcribing..."

If recordings keep showing "Transcribing..." status, check these:

### 1. ✅ AssemblyAI API Key

**Check Vercel:**
- Go to: https://vercel.com/omars-projects-7051f8d4/aiprojecthub/settings/environment-variables
- Verify `ASSEMBLYAI_API_KEY` is set
- Value should be: `0ffad391688d4276afb95b51e333ee6f`

**Test API Key:**
```bash
curl -X GET "https://api.assemblyai.com/v2/transcript/test" \
  -H "authorization: 0ffad391688d4276afb95b51e333ee6f"
```

### 2. ✅ Storage Bucket Public Access

**Critical:** AssemblyAI MUST be able to access the recording URL!

**Check Supabase:**
1. Go to: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/storage/buckets
2. Click on `meeting-recordings` bucket
3. Verify it's set to **PUBLIC** (not private)
4. If private, AssemblyAI can't access the files!

**Fix:**
```sql
-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'meeting-recordings';
```

### 3. ✅ Recording URLs Are Accessible

**Test a recording URL:**
1. Get a recording URL from Supabase
2. Try accessing it in browser - should download/play the file
3. If you get 403/404, the URL isn't accessible to AssemblyAI

**Common Issues:**
- ❌ Bucket is private → Make it PUBLIC
- ❌ RLS policies blocking → Disable RLS for storage
- ❌ Wrong URL format → Use `getPublicUrl()` correctly

### 4. ✅ Background Polling

**Check Vercel Logs:**
- Look for: `🔄 Starting background polling for transcription`
- Look for: `📊 Poll X/60 - Status: processing`
- Look for: `✅ Transcription completed`

**If polling isn't happening:**
- Serverless function may be timing out
- Use client-side polling (already added)

### 5. ✅ Client-Side Polling (NEW!)

**What was added:**
- Client polls every 15 seconds for recordings in progress
- Calls `/api/check-transcription` to check status
- Automatically updates when transcription completes
- Triggers AI processing when ready

**This should fix the "stuck transcribing" issue!**

---

## Quick Test

1. **Create a new recording**
2. **Check Vercel logs** for transcription activity
3. **Wait 1-2 minutes** - client-side polling should detect completion
4. **Check browser console** for polling messages

---

**Status:** ✅ Client-side polling added - should fix the issue!

