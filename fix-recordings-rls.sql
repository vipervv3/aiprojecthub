-- ================================================
-- FIX RECORDING_SESSIONS RLS POLICIES
-- ================================================
-- Run this in your Supabase SQL Editor!

-- Drop any existing recording policies
DROP POLICY IF EXISTS "Users can view own recordings" ON recording_sessions;
DROP POLICY IF EXISTS "Users can create recordings" ON recording_sessions;
DROP POLICY IF EXISTS "Users can update own recordings" ON recording_sessions;
DROP POLICY IF EXISTS "Users can delete own recordings" ON recording_sessions;

-- Create simple RLS policies for recording_sessions
CREATE POLICY "Users can view own recordings" ON recording_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create recordings" ON recording_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON recording_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings" ON recording_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Fix meetings policies (depend on recording_sessions)
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;

CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT USING (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT WITH CHECK (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

-- ================================================
-- DONE! Recordings are now secure!
-- ================================================

