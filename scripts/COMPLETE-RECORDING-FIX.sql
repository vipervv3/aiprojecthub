-- ============================================
-- COMPLETE RECORDING SYSTEM FIX
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- STEP 1: Check current state
DO $$ 
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'CHECKING RECORDING SYSTEM STATUS...';
  RAISE NOTICE '================================================';
END $$;

-- Check if meetings table has user_id column
DO $$ 
DECLARE 
  has_user_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'user_id'
  ) INTO has_user_id;
  
  IF has_user_id THEN
    RAISE NOTICE '✅ meetings.user_id column exists';
  ELSE
    RAISE NOTICE '❌ meetings.user_id column MISSING - will add it';
  END IF;
END $$;

-- Check if meetings table has project_id column
DO $$ 
DECLARE 
  has_project_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'project_id'
  ) INTO has_project_id;
  
  IF has_project_id THEN
    RAISE NOTICE '✅ meetings.project_id column exists';
  ELSE
    RAISE NOTICE '❌ meetings.project_id column MISSING - will add it';
  END IF;
END $$;

-- Check if recording_sessions has audio_url column
DO $$ 
DECLARE 
  has_audio_url BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recording_sessions' AND column_name = 'audio_url'
  ) INTO has_audio_url;
  
  IF has_audio_url THEN
    RAISE NOTICE '✅ recording_sessions.audio_url column exists';
  ELSE
    RAISE NOTICE '❌ recording_sessions.audio_url column MISSING - will add it';
  END IF;
END $$;

-- Check if meeting_tasks table exists
DO $$ 
DECLARE 
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'meeting_tasks'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ meeting_tasks table exists';
  ELSE
    RAISE NOTICE '❌ meeting_tasks table MISSING - will create it';
  END IF;
END $$;

-- ============================================
-- STEP 2: Add missing columns
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ADDING MISSING COLUMNS...';
  RAISE NOTICE '================================================';
END $$;

-- Add user_id to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'user_id') THEN
    ALTER TABLE meetings ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
    RAISE NOTICE '✅ Added user_id column to meetings';
  END IF;
END $$;

-- Add project_id to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'project_id') THEN
    ALTER TABLE meetings ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
    RAISE NOTICE '✅ Added project_id column to meetings';
  END IF;
END $$;

-- Add recording_url to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'recording_url') THEN
    ALTER TABLE meetings ADD COLUMN recording_url TEXT;
    RAISE NOTICE '✅ Added recording_url column to meetings';
  END IF;
END $$;

-- Add status to meetings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'meetings' AND column_name = 'status') THEN
    ALTER TABLE meetings ADD COLUMN status VARCHAR DEFAULT 'scheduled';
    RAISE NOTICE '✅ Added status column to meetings';
  END IF;
END $$;

-- Add audio_url to recording_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recording_sessions' AND column_name = 'audio_url') THEN
    ALTER TABLE recording_sessions ADD COLUMN audio_url TEXT;
    RAISE NOTICE '✅ Added audio_url column to recording_sessions';
  END IF;
END $$;

-- Add duration_seconds to recording_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'recording_sessions' AND column_name = 'duration_seconds') THEN
    ALTER TABLE recording_sessions ADD COLUMN duration_seconds INTEGER;
    RAISE NOTICE '✅ Added duration_seconds column to recording_sessions';
  END IF;
END $$;

-- ============================================
-- STEP 3: Create meeting_tasks table
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_task_id ON meeting_tasks(task_id);

DO $$ 
BEGIN
  RAISE NOTICE '✅ meeting_tasks table ready';
END $$;

-- ============================================
-- STEP 4: Backfill user_id for existing meetings
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'BACKFILLING USER IDs...';
  RAISE NOTICE '================================================';
END $$;

UPDATE meetings m
SET user_id = rs.user_id
FROM recording_sessions rs
WHERE m.recording_session_id = rs.id
  AND m.user_id IS NULL;

DO $$ 
DECLARE 
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE '✅ Updated % meeting(s) with user_id', updated_count;
  ELSE
    RAISE NOTICE '✅ All meetings already have user_id';
  END IF;
END $$;

-- ============================================
-- STEP 5: Fix RLS policies
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'UPDATING RLS POLICIES...';
  RAISE NOTICE '================================================';
END $$;

-- Enable RLS
ALTER TABLE meeting_tasks ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete own recordings" ON recording_sessions;

-- Create new policies for meetings
CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (auth.uid() = user_id);

-- Create delete policy for recording_sessions
CREATE POLICY "Users can delete own recordings" ON recording_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for meeting_tasks
DROP POLICY IF EXISTS "Users can view meeting tasks" ON meeting_tasks;
CREATE POLICY "Users can view meeting tasks" ON meeting_tasks
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

DO $$ 
BEGIN
  RAISE NOTICE '✅ RLS policies updated';
END $$;

-- ============================================
-- STEP 6: Final verification
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'VERIFICATION RESULTS:';
  RAISE NOTICE '================================================';
END $$;

-- Check columns
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'user_id') THEN
    RAISE NOTICE '✅ meetings.user_id: OK';
  ELSE
    RAISE NOTICE '❌ meetings.user_id: FAILED';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'project_id') THEN
    RAISE NOTICE '✅ meetings.project_id: OK';
  ELSE
    RAISE NOTICE '❌ meetings.project_id: FAILED';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recording_sessions' AND column_name = 'audio_url') THEN
    RAISE NOTICE '✅ recording_sessions.audio_url: OK';
  ELSE
    RAISE NOTICE '❌ recording_sessions.audio_url: FAILED';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_tasks') THEN
    RAISE NOTICE '✅ meeting_tasks table: OK';
  ELSE
    RAISE NOTICE '❌ meeting_tasks table: FAILED';
  END IF;
END $$;

-- Check policies
DO $$ 
DECLARE 
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'meetings' AND cmd = 'DELETE';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ DELETE policy for meetings: OK';
  ELSE
    RAISE NOTICE '❌ DELETE policy for meetings: MISSING';
  END IF;
END $$;

-- Final message
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ RECORDING SYSTEM FIX COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create storage bucket named "recordings" (if not exists)';
  RAISE NOTICE '2. Set bucket to PUBLIC';
  RAISE NOTICE '3. Try recording again';
  RAISE NOTICE '';
END $$;







