# AI Features Setup & Usage

## 🤖 What Was Just Added

The complete AI processing workflow for recordings is now fully implemented and connected!

### New Features:

1. **Automatic AI Processing**
   - When transcription completes → Automatically triggers AI analysis
   - Extracts tasks and action items
   - Generates meeting summaries
   - Creates meaningful meeting titles
   - Saves everything to your database

2. **Manual Processing Button**
   - New "Unprocessed Recordings" section on Meetings page
   - Shows recordings that are transcribed but not AI processed
   - One-click "Process with AI" button
   - Real-time processing status

3. **Task Creation**
   - Tasks automatically created from meetings
   - Added to your task board with priority levels
   - Tagged with meeting reference
   - AI-determined due dates

4. **Meeting Intelligence**
   - Summary generation
   - Action items extraction
   - Confidence scoring
   - Meeting type classification

## 📋 How It Works

### Automatic Workflow:

```
1. Record Audio
   ↓
2. Upload to Supabase Storage
   ↓
3. Trigger Transcription (AssemblyAI)
   ↓
4. Transcription Completes
   ↓
5. 🤖 AI Processing (AUTOMATIC)
   - Extract tasks
   - Generate summary
   - Create title
   ↓
6. Save to Database
   - Create meeting record
   - Create tasks
   - Update recording status
```

### Manual Processing:

If you have old recordings that weren't processed:
1. Go to Meetings page
2. Look for "Unprocessed Recordings" section (amber banner)
3. Click "Process with AI" button
4. Wait 10-30 seconds for processing
5. Meeting appears in "Past Meetings" section

## 🔧 Required Environment Variables

Make sure these are set in Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI Services
GROQ_API_KEY=your_groq_key               # ✅ PRIMARY - Fast & efficient (required)
OPENAI_API_KEY=your_openai_key           # Optional fallback
ASSEMBLYAI_API_KEY=your_assemblyai_key   # For transcription (required)

# App URL (for triggering processing)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📊 What Gets Created

### For Each Processed Recording:

1. **Meeting Record** (`meetings` table):
   - Meaningful AI-generated title
   - Summary of discussion
   - Action items list
   - AI insights and confidence score
   - Link to original recording

2. **Tasks** (`tasks` table):
   - One task per action item
   - AI-assigned priority (low/medium/high/urgent)
   - Description and context
   - Due date estimation
   - Tagged with meeting reference
   - Marked as `is_ai_generated = true`

3. **Updated Recording** (`recording_sessions` table):
   - `ai_processed = true`
   - Updated title
   - Meeting ID reference

## 🎯 Usage Examples

### Example 1: New Recording

```
1. Click "Start Recording" on Meetings page
2. Record: "We need to finish the user dashboard by Friday.
            Also, review the API performance issues."
3. Stop and save recording
4. Wait 2-3 minutes for transcription
5. AI automatically processes it (using Groq for speed)
6. Creates:
   - Meeting: "User Dashboard & API Performance Review"
   - Task 1: "Complete user dashboard" (high priority, due Friday)
   - Task 2: "Review API performance issues" (medium priority)
```

### Example 2: Process Old Recording

```
1. You have 5 old recordings from last week
2. Go to Meetings page
3. See "Unprocessed Recordings (5)" section
4. Click "Process with AI" on each one
5. Tasks and meetings created automatically
6. All action items now on your task board
```

## 🔍 Monitoring & Debugging

### Check if Processing Works:

1. **Vercel Logs** - Look for:
   ```
   ✅ Transcription completed for session: [id]
   🤖 Triggering AI processing for session: [id]
   🤖 Starting AI processing for session: [id]
   📋 Extracted X tasks
   📝 Generated title: "..."
   ✅ Meeting created: [id]
   🎉 AI processing complete
   ```

2. **Database Checks**:
   ```sql
   -- Check recordings status
   SELECT title, transcription_status, ai_processed, created_at 
   FROM recording_sessions 
   ORDER BY created_at DESC;

   -- Check created meetings
   SELECT title, summary, action_items, created_at 
   FROM meetings 
   ORDER BY created_at DESC;

   -- Check AI-generated tasks
   SELECT title, priority, is_ai_generated 
   FROM tasks 
   WHERE is_ai_generated = true;
   ```

3. **Frontend**:
   - Unprocessed recordings show in amber section
   - After processing, they move to "Past Meetings"
   - Tasks appear on Tasks page

## ⚠️ Troubleshooting

### "No AI processing happening"
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Check Vercel logs for errors
- Verify API keys are valid
- Make sure recording has transcription_text

### "Processing fails"
- Check AI service API keys (OpenAI or Groq)
- Review Vercel function logs
- Ensure transcription completed successfully
- Check database permissions

### "Tasks not appearing"
- Check Tasks page filters
- Look for `is_ai_generated = true` in database
- Verify meeting has `action_items` populated
- Check user_id matches

### "Old recordings not showing as unprocessed"
- Must have `transcription_status = 'completed'`
- Must have `transcription_text` (not empty)
- Must have `ai_processed = false`

## 🎨 UI Features

### Unprocessed Recordings Section:
- **Amber banner** - Indicates action required
- **Recording cards** - Shows title, date, duration
- **"Transcribed" badge** - Green checkmark
- **"Process with AI" button** - Triggers analysis
- **Loading state** - Spinner during processing

### Processed Meetings:
- **Expanded view** - Click to see details
- **Summary section** - Blue background
- **Action items** - Green background with checkboxes
- **AI Insights** - Purple background

## 📈 Performance

- **Transcription**: 1-3 minutes (depends on length)
- **AI Processing**: 10-30 seconds per recording
- **Task Creation**: < 1 second per task
- **Total Time**: ~2-4 minutes from recording to tasks

## 🚀 Next Steps After Setup

1. **Test with a sample recording**:
   - Record a short meeting (30 seconds)
   - Talk about 2-3 tasks
   - Wait for processing
   - Check Tasks page

2. **Process existing recordings**:
   - Go to Meetings page
   - Process old recordings one by one
   - Review generated tasks
   - Adjust if needed

3. **Use regularly**:
   - Record all meetings
   - Let AI extract tasks
   - Save time on manual note-taking

## 📚 API Endpoints

### Process Recording
```
POST /api/process-recording
Body: { sessionId, userId }
Response: { meeting, tasksCreated, summary, confidence }
```

### Check Processing Status
```
GET /api/process-recording?sessionId=xxx
Response: { processed, transcriptionStatus, meetingId }
```

---

**Status:** ✅ Fully Functional
**Last Updated:** November 4, 2025

