-- Fix Recording System Schema Issues
-- This script adds missing columns and tables for the recording system

-- ============================================
-- 1. Fix meetings table - Add missing columns
-- ============================================

-- Add user_id column to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'user_id') THEN
    ALTER TABLE meetings ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
  END IF;
END $$;

-- Add project_id column to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'project_id') THEN
    ALTER TABLE meetings ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
  END IF;
END $$;

-- Add recording_url column to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'recording_url') THEN
    ALTER TABLE meetings ADD COLUMN recording_url TEXT;
  END IF;
END $$;

-- Add status column to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'status') THEN
    ALTER TABLE meetings ADD COLUMN status VARCHAR DEFAULT 'scheduled' 
      CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
  END IF;
END $$;

-- ============================================
-- 2. Fix recording_sessions table - Add missing columns
-- ============================================

-- Add audio_url column (some code uses this instead of file_path)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recording_sessions' AND column_name = 'audio_url') THEN
    ALTER TABLE recording_sessions ADD COLUMN audio_url TEXT;
  END IF;
END $$;

-- Add duration_seconds as alias (code uses both duration and duration_seconds)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recording_sessions' AND column_name = 'duration_seconds') THEN
    -- Copy existing duration values if any
    ALTER TABLE recording_sessions ADD COLUMN duration_seconds INTEGER;
    
    -- Sync existing data
    UPDATE recording_sessions 
    SET duration_seconds = duration 
    WHERE duration IS NOT NULL AND duration_seconds IS NULL;
  END IF;
END $$;

-- Add title column if missing (required by API)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recording_sessions' AND column_name = 'title') THEN
    ALTER TABLE recording_sessions ADD COLUMN title VARCHAR DEFAULT 'Untitled Recording';
  END IF;
END $$;

-- ============================================
-- 3. Create meeting_tasks junction table
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, task_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_task_id ON meeting_tasks(task_id);

-- Enable RLS on meeting_tasks
ALTER TABLE meeting_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for meeting_tasks
DROP POLICY IF EXISTS "Users can view meeting tasks for their meetings" ON meeting_tasks;
CREATE POLICY "Users can view meeting tasks for their meetings" ON meeting_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meetings 
      WHERE meetings.id = meeting_tasks.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create meeting tasks" ON meeting_tasks;
CREATE POLICY "Users can create meeting tasks" ON meeting_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings 
      WHERE meetings.id = meeting_tasks.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. Update RLS policies for meetings with user_id
-- ============================================

-- Drop old policies that don't use user_id
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;

-- Create new policy for viewing meetings based on user_id
CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

-- Policy for creating meetings
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating meetings
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting meetings
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;
CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. Create/update storage bucket for recordings
-- ============================================

-- Note: Storage buckets are created via Supabase UI or separate storage API
-- This is a reference for what needs to be done:
-- 1. Create a storage bucket called 'recordings'
-- 2. Set it to public or authenticated access
-- 3. Configure RLS policies for the bucket

-- ============================================
-- 6. Add helpful indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_recording_sessions_audio_url ON recording_sessions(audio_url);
CREATE INDEX IF NOT EXISTS idx_meetings_recording_url ON meetings(recording_url);
CREATE INDEX IF NOT EXISTS idx_meetings_user_project ON meetings(user_id, project_id);

-- ============================================
-- Summary of changes:
-- ============================================
-- ✅ Added user_id, project_id, recording_url, status to meetings table
-- ✅ Added audio_url, duration_seconds to recording_sessions table  
-- ✅ Created meeting_tasks junction table
-- ✅ Updated RLS policies for meetings to use user_id
-- ✅ Added indexes for better query performance
-- 
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create 'recordings' storage bucket in Supabase Storage
-- 3. Configure storage bucket RLS policies
-- 4. Test the recording flow end-to-end







