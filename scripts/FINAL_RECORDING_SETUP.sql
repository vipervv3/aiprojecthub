-- ============================================================
-- FINAL RECORDING SETUP - Run this in Supabase SQL Editor
-- ============================================================
-- This will set up everything needed for meeting recordings
-- ============================================================

-- 1. Add columns to recording_sessions table
ALTER TABLE recording_sessions 
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chunks JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS upload_progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 2. Create meeting_tasks join table (if not exists)
CREATE TABLE IF NOT EXISTS meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, task_id)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recording_sessions_project_id ON recording_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_task_id ON meeting_tasks(task_id);

-- 4. Disable RLS for development
ALTER TABLE meeting_tasks DISABLE ROW LEVEL SECURITY;

-- 5. Update meetings table to support recording type
DO $$ 
BEGIN
  ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_meeting_type_check;
  ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check 
    CHECK (meeting_type IN ('regular', 'standup', 'review', 'planning', 'recording'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 6. Create storage bucket via SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-recordings',
  'meeting-recordings', 
  false,
  524288000,  -- 500MB
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- After running this:
-- 1. Refresh your app
-- 2. Click the floating recording button
-- 3. Select a project
-- 4. Start recording!
-- ============================================================




