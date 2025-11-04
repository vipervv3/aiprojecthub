-- FINAL FIX for delete recordings issue
-- Problem: Meetings have user_id column but existing meetings have NULL user_id
-- Solution: Backfill user_id from recording_sessions, then fix policies

-- ============================================
-- STEP 1: Backfill user_id for existing meetings
-- ============================================

-- Update all meetings that have a recording_session_id
-- Set their user_id to match the recording_session's user_id
UPDATE meetings m
SET user_id = rs.user_id
FROM recording_sessions rs
WHERE m.recording_session_id = rs.id
  AND m.user_id IS NULL;

-- For meetings without a recording_session_id, we can't determine the owner
-- These will need to be manually assigned or deleted

-- Check if any meetings still have NULL user_id
DO $$ 
DECLARE 
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM meetings WHERE user_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE NOTICE '⚠️ Warning: % meeting(s) still have NULL user_id. These cannot be deleted.', null_count;
  ELSE
    RAISE NOTICE '✅ All meetings now have user_id assigned!';
  END IF;
END $$;

-- ============================================
-- STEP 2: Fix DELETE and UPDATE policies
-- ============================================

-- Remove old policies that use recording_sessions relationship
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;

-- Create NEW policies using user_id directly (more reliable)
CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- ============================================
-- STEP 3: Add DELETE policy for recording_sessions (if missing)
-- ============================================

DROP POLICY IF EXISTS "Users can delete own recordings" ON recording_sessions;
CREATE POLICY "Users can delete own recordings" ON recording_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that policies are in place
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'DELETE' THEN '✅'
    ELSE '  '
  END as delete_enabled
FROM pg_policies 
WHERE tablename IN ('meetings', 'recording_sessions')
ORDER BY tablename, cmd;

-- Show current meetings with their user_id status
SELECT 
  id,
  title,
  user_id,
  CASE 
    WHEN user_id IS NULL THEN '❌ NULL (Cannot be deleted)'
    ELSE '✅ Has user_id'
  END as status,
  scheduled_at
FROM meetings
ORDER BY scheduled_at DESC
LIMIT 10;

SELECT '✅ DELETE policies configured! Try deleting a recording now.' as result;







