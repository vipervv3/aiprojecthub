-- Debug script to check why deletes aren't working
-- Run this to see what's wrong with the meetings table

-- 1. Check if meetings table has user_id column (required for new policies)
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'meetings' 
ORDER BY ordinal_position;

-- 2. Check what RLS policies exist for meetings
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'meetings';

-- 3. Check if any meetings exist in the database
SELECT 
  id,
  title,
  scheduled_at,
  recording_session_id,
  CASE 
    WHEN column_exists.exists THEN 'user_id exists'
    ELSE 'user_id MISSING' 
  END as user_id_status
FROM meetings
CROSS JOIN (
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'meetings' AND column_name = 'user_id'
  ) as exists
) column_exists
ORDER BY scheduled_at DESC
LIMIT 5;

-- 4. Check recording_sessions
SELECT 
  id,
  user_id,
  title,
  created_at
FROM recording_sessions
ORDER BY created_at DESC
LIMIT 5;

-- EXPECTED RESULTS:
-- If user_id column is MISSING from meetings, the DELETE policy won't work
-- The fix-recording-system.sql script should have added it







