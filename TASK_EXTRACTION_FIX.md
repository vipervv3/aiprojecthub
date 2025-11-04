# Task Extraction Fix - November 4, 2025

## Problem

Task extraction was NOT working for new recordings. The user reported that "task extraction is not working, the task should be extracted from the recording and assign it to the select project, this was working before what happen".

## Root Cause Analysis

After comprehensive diagnostics, we discovered the issue:

### The Actual Problem

The `minimizable-recording-widget.tsx` component was **NOT using the correct API routes** that we had previously fixed. Instead, it was:

1. ❌ **Directly uploading to Supabase Storage** and manually creating database records
2. ❌ **Storing the public URL in `file_path`** instead of the relative storage path
3. ❌ **Using its own custom `processRecordingInBackground` function** instead of the standardized API routes
4. ❌ **Creating meetings with no actual transcription**, just placeholder data

### Evidence from Diagnostics

```
Recording ID: 7472927f-15c4-4e05-b1c6-4d0c44c15fd2
File Path: https://xekyfsnxrnfkdvrcsiye.supabase.co/.../recording_xxx.webm (WRONG - should be relative path)
File Size: null (WRONG - should be actual bytes)
Duration: 0 (WRONG - should be actual seconds)
Transcription Status: pending (STUCK - never completed)
AI Processed: true (WRONG - marked as processed despite no transcription)
Meeting Created: YES (but no tasks extracted!)
Tasks Created: 0 (THE PROBLEM!)
```

### Why This Happened

The project has **3 different recording components**:
1. `recording-modal.tsx` - ✅ Uses API routes correctly
2. `enhanced-recording-modal.tsx` - ❓ Status unknown
3. `minimizable-recording-widget.tsx` - ❌ Was NOT using API routes

The user was using the minimizable widget, which had outdated upload logic that bypassed our fixed API pipeline.

## The Correct Flow (What Should Happen)

```
1. User records audio → minimizable-recording-widget.tsx
2. Widget uploads to → /api/recordings
   - Saves file to Supabase Storage
   - Stores RELATIVE path in file_path
   - Creates recording_sessions record with projectId
3. /api/recordings triggers → /api/transcribe
4. /api/transcribe calls AssemblyAI
5. When transcription completes → /api/transcribe triggers /api/process-recording
6. /api/process-recording:
   - Extracts tasks using AI (Groq/OpenAI)
   - Creates meeting record
   - Creates tasks in tasks table
   - Links tasks to selected project
```

## The Fix

### Changes to `minimizable-recording-widget.tsx`

**Replaced the entire upload logic** to use the standardized API routes:

```typescript
// OLD CODE (WRONG):
const fileName = `recording_${Date.now()}_${user?.id}.webm`
const { data: uploadData } = await supabase.storage
  .from('meeting-recordings')
  .upload(fileName, blob, {...})

const { data: { publicUrl } } = supabase.storage
  .from('meeting-recordings')
  .getPublicUrl(fileName)

await supabase
  .from('recording_sessions')
  .insert({
    file_path: publicUrl, // ❌ WRONG!
    ...
  })

// Then manually created meetings and ran custom processing
processRecordingInBackground(sessionId, meetingId, publicUrl, selectedProjectId)

// NEW CODE (CORRECT):
const formData = new FormData()
formData.append('audio', blob, 'recording.webm')
formData.append('title', tempTitle)
formData.append('duration', recordingTime.toString())
formData.append('userId', user.id)
formData.append('projectId', selectedProjectId)

const response = await fetch('/api/recordings', {
  method: 'POST',
  body: formData,
})

const result = await response.json()

// Trigger transcription (which automatically triggers AI processing)
await fetch('/api/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recordingUrl: result.recordingUrl,
    sessionId: result.session.id,
  }),
})
```

**Removed obsolete code**:
- Deleted entire `processRecordingInBackground()` function (108 lines)
- Removed manual Supabase Storage upload logic
- Removed manual database record creation

## Verification

After fix, the flow should be:

1. ✅ Recording uploaded via `/api/recordings`
2. ✅ File saved with correct relative path: `recordings/{userId}/recording_{timestamp}.webm`
3. ✅ Transcription triggered via `/api/transcribe`
4. ✅ AssemblyAI processes audio (async)
5. ✅ When complete, `/api/process-recording` is triggered
6. ✅ AI extracts tasks and assigns to selected project
7. ✅ Tasks appear in tasks table with correct `project_id`

## Testing Instructions

1. **Clear old broken recordings** (optional - they can stay, just won't have tasks):
   ```sql
   -- View broken recordings
   SELECT id, title, file_path, transcription_status, ai_processed
   FROM recording_sessions
   WHERE file_path LIKE 'https://%'; -- These have wrong format
   ```

2. **Test new recording**:
   - Go to app
   - Start new recording with minimizable widget
   - Select a project
   - Record some audio with actionable items (e.g., "We need to schedule a meeting to discuss the proposal")
   - Stop and upload
   - Wait 30-60 seconds for transcription + AI processing
   - Check tasks page - should see new tasks assigned to selected project

3. **Verify in database**:
   ```sql
   -- Check recording was created correctly
   SELECT id, file_path, file_size, duration, transcription_status
   FROM recording_sessions
   ORDER BY created_at DESC LIMIT 1;
   
   -- Should show:
   -- file_path: recordings/xxx/recording_xxx.webm (NOT a full URL)
   -- file_size: actual bytes (NOT null)
   -- duration: actual seconds (NOT 0)
   
   -- Check tasks were created
   SELECT t.title, t.project_id, t.tags
   FROM tasks t
   WHERE t.is_ai_generated = true
   ORDER BY t.created_at DESC
   LIMIT 5;
   ```

## Files Changed

- `components/meetings/minimizable-recording-widget.tsx` - Fixed to use API routes
- `scripts/debug-task-extraction.js` - New diagnostic script
- `scripts/check-tasks-schema.js` - New diagnostic script
- `scripts/fix-stuck-transcription.js` - New diagnostic script
- `scripts/check-all-recordings.js` - New diagnostic script
- `TASK_EXTRACTION_FIX.md` - This document

## Related Issues

- The other recording components (`recording-modal.tsx`, `enhanced-recording-modal.tsx`) should be reviewed to ensure they also use the correct API routes
- Consider consolidating to a single recording component to avoid inconsistencies

## Deployment

**CRITICAL:** These changes MUST be deployed to Vercel for users to benefit from the fix!

```bash
git add .
git commit -m "fix: task extraction not working - minimizable widget now uses correct API routes"
git push origin main
```

After push, Vercel will automatically deploy. Users should:
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache if still seeing issues
3. Try a new recording

---

**Status:** ✅ Fixed and ready for deployment
**Priority:** 🔴 CRITICAL - Core feature was completely broken
**Impact:** 🎯 HIGH - All recordings made with minimizable widget were not creating tasks

