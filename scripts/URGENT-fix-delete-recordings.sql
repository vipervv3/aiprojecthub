-- ⚠️ URGENT FIX: Enable deletion of recordings
-- This fixes the "recording comes back after delete" bug

-- Problem: meetings table has NO DELETE policy, so RLS blocks all deletions
-- Solution: Add DELETE policy + UPDATE policy for meetings table

-- ============================================
-- OPTION 1: Quick Fix (Use this if you haven't run the full migration yet)
-- ============================================

-- Add DELETE policy for meetings (using recording_sessions relationship)
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;
CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

-- Add UPDATE policy for meetings (currently missing)
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

-- Add DELETE policy for recording_sessions (currently missing)
DROP POLICY IF EXISTS "Users can delete own recordings" ON recording_sessions;
CREATE POLICY "Users can delete own recordings" ON recording_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- OPTION 2: Better Fix (Run the full migration)
-- ============================================
-- For a proper long-term solution, also run:
-- scripts/fix-recording-system.sql
-- 
-- This adds the user_id column to meetings table and creates
-- better policies that don't rely on the recording_sessions relationship

-- ============================================
-- Test the fix:
-- ============================================
-- After running this script:
-- 1. Go to your Meetings page
-- 2. Try deleting a recording
-- 3. It should delete and NOT come back
-- 4. If it still comes back, check the browser console for errors

SELECT 'DELETE policies added successfully! ✅' as status;







