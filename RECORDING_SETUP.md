# Recording Feature Setup

## ✅ What Was Fixed

The recording feature was incomplete - recordings were NOT being saved to the database or storage. This has now been fixed!

### Changes Made:

1. **Created `/app/api/recordings/route.ts`**
   - POST endpoint to upload audio files to Supabase Storage
   - Saves recording metadata to `recording_sessions` table
   - Automatically triggers transcription via AssemblyAI

2. **Updated `/components/meetings/recording-modal.tsx`**
   - Replaced simulated upload with real Supabase storage upload
   - Added user authentication check
   - Integrated with transcription API
   - Better error handling and user feedback

## 🔧 Required Setup in Supabase

### 1. Storage Bucket (Already Created ✅)

Your storage bucket `meeting-recordings` is already set up and working! No action needed.

If you ever need to recreate it:
1. Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/storage/buckets
2. Click "Create new bucket"
3. **Bucket name:** `meeting-recordings`
4. **Public bucket:** ✅ YES (check this)
5. **File size limit:** 50 MB (or more if needed)
6. **Allowed MIME types:** `audio/webm, audio/wav, audio/mp3, audio/mpeg`
7. Click "Create bucket"

### 2. Set Storage Policies

After creating the bucket, set these policies:

#### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Policy 2: Allow public read access
```sql
CREATE POLICY "Public can read recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'meeting-recordings');
```

Or use the Supabase UI:
1. Go to Storage > Policies
2. Select "meeting-recordings" bucket
3. Add policies via the UI

### 3. Environment Variables

Make sure these are set in your `.env.local` and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📝 How It Works Now

1. **User records audio** → Audio blob created in browser
2. **User saves recording** → Uploaded to `/api/recordings`
3. **API uploads to storage** → Saved to `recordings` bucket in Supabase
4. **API creates database record** → Saved to `recording_sessions` table
5. **API triggers transcription** → Calls `/api/transcribe` with AssemblyAI
6. **Transcription completes** → Updates `recording_sessions` with transcript

## ✅ Testing the Feature

1. Go to Meetings page
2. Click "Start Recording"
3. Record some audio
4. Give it a title
5. Click "Upload"
6. Check the Meetings page to see your recording listed
7. Check Supabase Storage to see the audio file

## 🐛 Troubleshooting

### "Failed to upload recording"
- Check that the `meeting-recordings` bucket exists in Supabase
- Verify storage policies are set correctly
- Check browser console for detailed error

### "You must be logged in to save recordings"
- Ensure user is authenticated
- Check `NEXT_PUBLIC_SUPABASE_URL` is set correctly

### Recordings show but transcription fails
- Check `ASSEMBLYAI_API_KEY` is set in environment variables
- Check Vercel logs for transcription errors
- Transcription is optional - recordings still work without it

## 📊 Database Schema

The `recording_sessions` table structure:
```sql
CREATE TABLE recording_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  file_path TEXT NOT NULL,          -- Path in Supabase storage
  file_size BIGINT,                 -- Size in bytes
  duration INTEGER,                 -- Duration in seconds
  transcription_status VARCHAR DEFAULT 'pending',
  transcription_text TEXT,
  transcription_confidence DECIMAL(3,2),
  ai_processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Next Steps

After setup:
1. Test recording a short audio clip
2. Verify it appears in the Meetings page
3. Check Supabase Storage to see the file
4. Check Supabase database to see the record
5. Monitor Vercel logs for any errors

---

**Status:** ✅ Ready to deploy
**Last Updated:** November 4, 2025

