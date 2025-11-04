# Vercel Environment Variables Setup

## 🚨 CRITICAL: Complete Setup for AI Features

This guide ensures all AI processing features work correctly on Vercel.

## 📋 Required Environment Variables

Copy these EXACT values to your Vercel project:

### 1. Supabase Configuration

```bash
# Copy these values from your .env.local file
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
SUPABASE_JWT_SECRET=<your_jwt_secret>
```

### 2. AI Services (REQUIRED)

```bash
# Primary AI - Groq (REQUIRED)
GROQ_API_KEY=<your_groq_api_key>

# Transcription - AssemblyAI (REQUIRED)
ASSEMBLYAI_API_KEY=<your_assemblyai_api_key>
```

### 3. App URL (CRITICAL FOR AUTO-PROCESSING)

```bash
# Replace with your actual Vercel deployment URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**⚠️ IMPORTANT:** After first deployment, update this with your actual Vercel URL!

### 4. Database (Copy from your .env.local)

```bash
POSTGRES_URL=<your_postgres_url>
POSTGRES_USER=postgres
POSTGRES_HOST=<your_postgres_host>
POSTGRES_PASSWORD=<your_postgres_password>
POSTGRES_DATABASE=postgres
POSTGRES_PRISMA_URL=<your_prisma_url>
POSTGRES_URL_NON_POOLING=<your_postgres_url_non_pooling>
```

### 5. Email & Notifications (Copy from your .env.local)

```bash
RESEND_API_KEY=<your_resend_api_key>
NOTIFICATION_CRON_SCHEDULE=0 8 * * *
MORNING_NOTIFICATION_TIME=08:00
AI_NOTIFICATION_THRESHOLD=0.8
CRON_SECRET=<your_cron_secret>
```

## 🔧 Step-by-Step Vercel Setup

### Step 1: Access Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click "Settings"
4. Click "Environment Variables"

### Step 2: Add All Variables

For EACH variable above:

1. Click "Add New"
2. **Key**: Copy the variable name (e.g., `GROQ_API_KEY`)
3. **Value**: Copy the corresponding value
4. **Environments**: Check ALL THREE:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click "Save"

### Step 3: Critical Variables (Don't Miss These!)

These are ABSOLUTELY REQUIRED for AI features:

- ✅ `GROQ_API_KEY` - Primary AI processing
- ✅ `ASSEMBLYAI_API_KEY` - Transcription
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Database access
- ✅ `NEXT_PUBLIC_APP_URL` - Auto-processing trigger

### Step 4: Update App URL After First Deploy

1. Deploy your app to Vercel
2. Copy your deployment URL (e.g., `https://aiprojecthub.vercel.app`)
3. Go back to Environment Variables
4. Find `NEXT_PUBLIC_APP_URL`
5. Update it with your actual URL
6. Redeploy

## ✅ Verification Checklist

After setting up Vercel, verify:

```bash
# Run locally first to test
npm run verify-ai-setup
# or
node scripts/verify-ai-setup.js
```

### What the script checks:

- ✅ All environment variables present
- ✅ Supabase connection working
- ✅ Database tables accessible
- ✅ Storage bucket exists
- ✅ AI API keys valid format
- ✅ API routes exist
- ✅ Unprocessed recordings found

## 🚀 Testing After Deployment

### 1. Test Recording Upload

1. Go to your Vercel app URL
2. Navigate to Meetings page
3. Click "Start Recording"
4. Record 10 seconds of speech
5. Stop and save with a title
6. Check Vercel logs for:
   ```
   ✅ Recording saved: [id] - "[title]"
   🎙️ Transcription started
   ```

### 2. Test Transcription

After 1-2 minutes, check Vercel logs for:
```
✅ Transcription completed for session: [id]
🤖 Triggering AI processing for session: [id]
```

### 3. Test AI Processing

After another 10-30 seconds, check for:
```
🤖 Starting AI processing for session: [id]
📋 Extracted X tasks
📝 Generated title: "..."
✅ Meeting created: [id]
✅ Created X tasks
🎉 AI processing complete
```

### 4. Verify Results

1. **Meetings Page**: Should show new meeting with meaningful title
2. **Tasks Page**: Should show extracted tasks
3. **Meeting Details**: Click to expand, should show summary and action items

## 🐛 Troubleshooting

### "Transcription not starting"

Check Vercel logs:
- `ASSEMBLYAI_API_KEY` is set
- Recording uploaded to storage successfully
- API route `/api/transcribe` is working

### "AI processing not triggered"

Check Vercel logs:
- `NEXT_PUBLIC_APP_URL` is set to correct URL
- Look for "🤖 Triggering AI processing" message
- Check `/api/process-recording` route

### "Task extraction fails"

Check Vercel logs:
- `GROQ_API_KEY` is set and valid
- Look for error messages from Groq API
- Check if transcription_text exists

### "No tasks created"

Check Vercel logs:
- Look for "📋 Extracted X tasks" (if X = 0, AI found no tasks)
- Verify recording had actual actionable content
- Check database: `SELECT * FROM tasks WHERE is_ai_generated = true`

## 📊 Monitoring

### Vercel Logs

View real-time logs:
```
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs"
4. Filter by "Function Logs"
```

Look for these key messages:
- `✅ Recording saved`
- `✅ Transcription completed`
- `🤖 Starting AI processing`
- `📋 Extracted X tasks`
- `✅ Meeting created`

### Database Monitoring

Check in Supabase SQL Editor:

```sql
-- Unprocessed recordings
SELECT title, transcription_status, ai_processed, created_at 
FROM recording_sessions 
WHERE transcription_status = 'completed' AND ai_processed = false
ORDER BY created_at DESC;

-- Recent meetings
SELECT title, summary, created_at 
FROM meetings 
ORDER BY created_at DESC 
LIMIT 10;

-- AI-generated tasks
SELECT title, priority, created_at 
FROM tasks 
WHERE is_ai_generated = true 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎯 Success Criteria

Your AI features are working if:

1. ✅ Recordings upload to storage
2. ✅ Transcription completes in 1-3 minutes
3. ✅ AI processing auto-triggers
4. ✅ Meaningful titles generated
5. ✅ Summaries created
6. ✅ Tasks extracted and appear in task board
7. ✅ No errors in Vercel logs

## 📞 Support

If you encounter issues:

1. Run `node scripts/verify-ai-setup.js` locally
2. Check Vercel logs for error messages
3. Verify all env vars are set in Vercel
4. Check database for data consistency
5. Test with a simple recording ("Create task to review the dashboard")

---

**Last Updated:** November 4, 2025
**Status:** ✅ Production Ready

