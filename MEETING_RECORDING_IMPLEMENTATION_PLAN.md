# Meeting Recording Implementation Plan

**Date:** October 10, 2025  
**Feature:** Live Meeting Recording with AI Transcription & Task Generation

---

## 🎯 Feature Requirements

### Core Features
1. **Live Recording with Real-time Upload**
   - Record audio in browser
   - Stream chunks to Supabase Storage as recording happens
   - No data loss - continuous upload
   - Must select project before starting

2. **Floating Recording Button**
   - Visible on all pages for logged-in users
   - Bottom-right corner
   - Quick access to start recording
   - Shows recording status when active

3. **AssemblyAI Transcription**
   - Auto-transcribe after recording completes
   - Display transcript on meeting page
   - Store transcript in database

4. **Groq AI Task Generation**
   - Analyze transcript for action items
   - Automatically create tasks
   - Add tasks to selected project
   - Link tasks to meeting

---

## 📋 Implementation Phases

### Phase 1: Supabase Storage Setup ✅
- [x] Create storage bucket for recordings
- [x] Set up bucket policies
- [x] Configure CORS

### Phase 2: Live Recording with Chunked Upload
- [ ] Implement MediaRecorder with timeslice
- [ ] Upload chunks to Supabase Storage progressively
- [ ] Handle network errors and retry
- [ ] Show upload progress

### Phase 3: Project Selection UI
- [ ] Add project selector to recording modal
- [ ] Load user's projects
- [ ] Validate project selection before recording
- [ ] Save project_id with recording

### Phase 4: Floating Recording Button
- [ ] Create FloatingRecordingButton component
- [ ] Add to app layout for all pages
- [ ] Show/hide based on auth status
- [ ] Display recording status indicator

### Phase 5: AssemblyAI Integration
- [ ] Create AssemblyAI service
- [ ] Upload recorded file to AssemblyAI
- [ ] Poll for transcription status
- [ ] Save transcript to database
- [ ] Display on meeting page

### Phase 6: Groq AI Task Generation
- [ ] Create Groq AI service
- [ ] Analyze transcript for action items
- [ ] Extract task details (title, description, priority)
- [ ] Create tasks in database
- [ ] Link tasks to meeting and project

### Phase 7: UI Enhancements
- [ ] Meeting detail page with transcript
- [ ] Task list from meeting
- [ ] Recording status indicators
- [ ] Error handling and user feedback

---

## 🏗️ Architecture

### Recording Flow
```
User clicks Record
  ↓
Select Project (required)
  ↓
MediaRecorder starts
  ↓
Chunks captured every 10 seconds
  ↓
Each chunk uploaded to Supabase Storage
  ↓
User stops recording
  ↓
Final assembly of chunks
  ↓
Create recording_sessions entry
  ↓
Trigger AI processing
```

### AI Processing Flow
```
Recording Complete
  ↓
Send to AssemblyAI for transcription
  ↓
Poll every 5 seconds for status
  ↓
Transcription complete
  ↓
Save transcript to database
  ↓
Send transcript to Groq AI
  ↓
Extract action items & tasks
  ↓
Create tasks in database
  ↓
Link tasks to project & meeting
  ↓
Notify user
```

---

## 📁 Files to Create/Modify

### New Files
1. `lib/services/recording-upload-service.ts` - Chunked upload handler
2. `lib/services/assemblyai-service.ts` - AssemblyAI integration
3. `lib/services/groq-service.ts` - Groq AI integration  
4. `lib/services/task-generation-service.ts` - AI task extraction
5. `components/recording/FloatingRecordingButton.tsx` - Global button
6. `components/recording/ProjectSelector.tsx` - Project selection
7. `app/api/transcribe/route.ts` - Transcription API endpoint
8. `app/api/generate-tasks/route.ts` - Task generation endpoint
9. `app/meetings/[id]/page.tsx` - Meeting detail page

### Modified Files
1. `components/meetings/recording-modal.tsx` - Add project selector, chunked upload
2. `components/layout/app-layout.tsx` - Add floating button
3. `lib/database/schema.sql` - Update recording_sessions table
4. `env.example` - Add API keys

---

## 🗄️ Database Schema Updates

### recording_sessions table
```sql
ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS chunks JSONB DEFAULT '[]';
ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS upload_progress INTEGER DEFAULT 0;
```

### Create storage bucket
```sql
-- In Supabase Dashboard → Storage
Bucket name: meeting-recordings
Public: false
File size limit: 500MB
Allowed MIME types: audio/webm, audio/wav, audio/mp3
```

---

## 🔌 API Integrations

### AssemblyAI Setup
```typescript
// lib/services/assemblyai-service.ts
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2'

1. Upload audio file
2. Create transcription job
3. Poll for completion
4. Retrieve transcript
```

### Groq AI Setup
```typescript
// lib/services/groq-service.ts
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = 'mixtral-8x7b-32768'

Prompt: "Extract action items from this meeting transcript..."
```

---

## 🎨 UI Components

### FloatingRecordingButton
```tsx
Position: fixed bottom-6 right-6
States:
- Idle: Red microphone icon
- Recording: Pulsing red dot + timer
- Processing: Spinner

Click behavior:
- Opens recording modal if not recording
- Shows recording status if recording
```

### Enhanced RecordingModal
```tsx
New features:
- Project selector dropdown (required)
- Real-time upload progress bar
- Chunk upload status
- Network error recovery
- Pause/Resume (maintains upload)
```

### Meeting Detail Page
```tsx
URL: /meetings/[id]
Displays:
- Meeting metadata
- Full transcript (with timestamps)
- Auto-generated tasks
- Recording player
- Edit transcript option
```

---

## 🔐 Security & Permissions

### Storage Bucket Policy
```sql
-- Only authenticated users can upload
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meeting-recordings');

-- Users can only access their own recordings
CREATE POLICY "Users can access own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🧪 Testing Checklist

### Recording
- [ ] Start recording without project (should fail)
- [ ] Start recording with project selected
- [ ] Record for 30+ seconds
- [ ] Verify chunks uploaded progressively
- [ ] Stop recording mid-stream
- [ ] Verify final file assembled correctly
- [ ] Test network disconnection recovery

### Transcription
- [ ] Upload 1-minute recording
- [ ] Verify AssemblyAI processing
- [ ] Check transcript accuracy
- [ ] Test error handling

### Task Generation
- [ ] Transcript with clear action items
- [ ] Verify tasks created correctly
- [ ] Check project linking
- [ ] Verify task details (title, priority)

### UI/UX
- [ ] Floating button visible on all pages
- [ ] Button hides when not logged in
- [ ] Recording indicator shows active state
- [ ] Upload progress accurate
- [ ] Error messages clear and helpful

---

## 📊 Success Metrics

1. **Recording Reliability:** 99%+ successful uploads
2. **Data Loss:** 0% - all chunks uploaded
3. **Transcription Accuracy:** 90%+ word accuracy
4. **Task Generation:** 80%+ relevant tasks extracted
5. **User Experience:** < 5 seconds from stop to transcript start

---

## 🚀 Implementation Order

### Week 1: Core Recording
1. Day 1-2: Chunked upload system
2. Day 3-4: Project selection UI
3. Day 5: Floating button component

### Week 2: AI Integration
1. Day 1-2: AssemblyAI transcription
2. Day 3-4: Groq task generation
3. Day 5: Meeting detail page

### Week 3: Polish & Testing
1. Day 1-2: Error handling
2. Day 3-4: UI polish
3. Day 5: Testing & fixes

---

## 🔑 Environment Variables Needed

```env
# AssemblyAI
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=meeting-recordings
```

---

## 📝 Notes

- Use MediaRecorder with timeslice of 10000ms (10 seconds) for chunking
- Store chunk URLs in recording_sessions.chunks JSONB array
- AssemblyAI polling interval: 5 seconds
- Groq AI timeout: 30 seconds
- Maximum recording duration: 2 hours
- Auto-save draft every 30 seconds during recording

---

**Status:** Ready to implement  
**Priority:** High  
**Estimated Time:** 2-3 weeks  
**Dependencies:** Supabase Storage, AssemblyAI API, Groq API




