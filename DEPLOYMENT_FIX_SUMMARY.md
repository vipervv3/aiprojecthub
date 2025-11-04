# 🚀 Recording & Deployment Fixes - Complete

## ✅ Issues Fixed

### 1. **Transcribe API Supabase Client Fix**
- **Problem**: API route was using client-side `supabase` import which doesn't work in server-side API routes
- **Fix**: Changed to use `createClient` from `@supabase/supabase-js` with service role key
- **Files Changed**: `app/api/transcribe/route.ts`

### 2. **Storage Bucket Name Consistency**
- **Problem**: Environment variable example showed `recordings` but code uses `meeting-recordings`
- **Fix**: Updated `env.example` to match actual bucket name: `meeting-recordings`
- **Files Changed**: `env.example`

### 3. **AssemblyAI Job ID Storage**
- **Problem**: Code tried to set `assemblyai_job_id` column that doesn't exist in schema
- **Fix**: Store `assemblyai_job_id` in metadata JSONB field instead
- **Files Changed**: `app/api/transcribe/route.ts`

### 4. **Vercel Cron Configuration**
- **Problem**: Cron job ran every minute (too frequent) and auth check was too strict
- **Fix**: 
  - Changed schedule to every 5 minutes (`*/5 * * * *`)
  - Made auth check more flexible for Vercel's automatic cron authentication
- **Files Changed**: `vercel.json`, `app/api/cron/process-completed-transcriptions/route.ts`

## 📋 Deployment Checklist

### Before Deploying to Vercel:

1. **Set Environment Variables in Vercel Dashboard**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xekyfsnxrnfkdvrcsiye.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   GROQ_API_KEY=gsk_your_key
   ASSEMBLYAI_API_KEY=your_assemblyai_key
   OPENAI_API_KEY=your_openai_key (optional fallback)
   
   RESEND_API_KEY=your_resend_key
   
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   CRON_SECRET=your_random_secret_string
   ```

2. **Verify Storage Bucket**:
   - Bucket name: `meeting-recordings`
   - Must be PUBLIC for recordings to be accessible
   - Should already exist based on your setup

3. **Deploy to Vercel**:
   ```bash
   # If using Vercel CLI
   vercel --prod
   
   # Or push to GitHub and let Vercel auto-deploy
   git add .
   git commit -m "Fix recording and deployment issues"
   git push origin main
   ```

4. **After First Deploy**:
   - ⚠️ **CRITICAL**: Update `NEXT_PUBLIC_APP_URL` in Vercel dashboard with your actual Vercel URL
   - Example: `https://your-app-name.vercel.app`
   - This is required for transcription polling and AI processing to work

5. **Test Recording Flow**:
   - Record a test audio
   - Upload it
   - Check that transcription starts
   - Verify AI processing completes
   - Check that tasks are created

## 🔧 Technical Details

### Recording Flow:
1. User records audio → `recording-modal.tsx`
2. Uploads to `/api/recordings` → Saves to Supabase Storage (`meeting-recordings` bucket)
3. Creates `recording_sessions` record
4. Starts transcription → `/api/transcribe` → AssemblyAI
5. Background polling waits for transcription completion
6. When complete → Triggers `/api/process-recording`
7. AI extracts tasks and creates meeting → `/api/process-recording`
8. Cron job catches any missed recordings → `/api/cron/process-completed-transcriptions`

### Key Environment Variables:
- `NEXT_PUBLIC_APP_URL`: Required for internal API calls (transcription polling, AI processing)
- `SUPABASE_SERVICE_ROLE_KEY`: Required for server-side operations bypassing RLS
- `ASSEMBLYAI_API_KEY`: Required for transcription
- `GROQ_API_KEY`: Required for AI processing (primary)
- `CRON_SECRET`: Optional but recommended for cron security

## ✅ Verification Steps

After deployment, verify:

1. **Recording Upload**:
   - [ ] Can record audio
   - [ ] Can upload recording
   - [ ] Recording appears in database

2. **Transcription**:
   - [ ] Transcription job starts
   - [ ] Transcription completes
   - [ ] Transcription text saved to database

3. **AI Processing**:
   - [ ] Meeting is created from recording
   - [ ] Tasks are extracted and created
   - [ ] Project association works (if project selected)

4. **Cron Job**:
   - [ ] Cron job runs every 5 minutes
   - [ ] Processes any missed recordings
   - [ ] No errors in Vercel logs

## 🐛 Troubleshooting

### Recording not uploading:
- Check Supabase Storage bucket exists: `meeting-recordings`
- Verify bucket is PUBLIC
- Check `SUPABASE_SERVICE_ROLE_KEY` is set

### Transcription not starting:
- Verify `ASSEMBLYAI_API_KEY` is set
- Check recording URL is accessible (bucket must be PUBLIC)
- Check Vercel function logs for errors

### AI processing not working:
- Verify `GROQ_API_KEY` is set
- Check `NEXT_PUBLIC_APP_URL` is set to actual Vercel URL
- Check `/api/process-recording` endpoint logs

### Cron job not running:
- Verify `vercel.json` is committed
- Check Vercel project settings for cron jobs
- Verify cron secret is set (or allow without auth for testing)

## 📝 Notes

- Storage bucket name is hardcoded as `meeting-recordings` in the code
- All Supabase operations use service role key in API routes to bypass RLS
- Transcription polling happens in background (non-blocking)
- Cron job runs every 5 minutes to catch any missed recordings
- Project context is preserved throughout the recording → meeting → tasks flow

