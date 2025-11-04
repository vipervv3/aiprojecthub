-- ================================================
-- FIX USER ID MISMATCH ISSUE
-- ================================================
-- Run this in Supabase SQL Editor
-- Copy ALL of this and run it in ONE go!

-- ================================================
-- STEP 1: Find your real user ID
-- ================================================
-- This will show ALL users - find YOUR email
SELECT 
  id as user_id,
  email,
  created_at,
  CASE 
    WHEN created_at = (SELECT MIN(created_at) FROM auth.users) THEN '← YOUR ACCOUNT (oldest)'
    ELSE ''
  END as note
FROM auth.users
ORDER BY created_at ASC;

-- STOP HERE! Look at the results above.
-- Find YOUR email address.
-- Copy the UUID (user_id) next to YOUR email.
-- That's your REAL user ID.

-- ================================================
-- EXAMPLE: If your real user ID is: abc-123-def-456
-- And the wrong ID in your data is: 0d29164e-53f6-4a05-a070-e8cae3f7ec31
-- ================================================

-- ================================================
-- STEP 2: BEFORE FIXING - See what needs updating
-- ================================================

-- Check projects (should show the wrong user_id)
SELECT 'Projects with wrong user_id:' as check_type, COUNT(*) as count
FROM projects 
WHERE owner_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31'

UNION ALL

-- Check recordings (should show the wrong user_id)
SELECT 'Recordings with wrong user_id:', COUNT(*)
FROM recording_sessions 
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31'

UNION ALL

-- Check activities
SELECT 'Activities with wrong user_id:', COUNT(*)
FROM activity_log 
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31'

UNION ALL

-- Check notifications
SELECT 'Notifications with wrong user_id:', COUNT(*)
FROM notifications 
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31';

-- ================================================
-- STEP 3: Temporarily disable RLS (so we can fix data)
-- ================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE recording_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules DISABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 4: UPDATE ALL DATA
-- ================================================
-- ⚠️ IMPORTANT: Replace 'YOUR_REAL_USER_ID_HERE' below with 
-- the UUID you copied from STEP 1!

-- Example: If your real ID is abc-123-def-456, replace:
-- 'YOUR_REAL_USER_ID_HERE' with 'abc-123-def-456'

-- Update projects
UPDATE projects 
SET owner_id = 'YOUR_REAL_USER_ID_HERE'
WHERE owner_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31';

-- Update recording_sessions
UPDATE recording_sessions 
SET user_id = 'YOUR_REAL_USER_ID_HERE'
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31';

-- Update activity_log
UPDATE activity_log 
SET user_id = 'YOUR_REAL_USER_ID_HERE'
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31';

-- Update notifications
UPDATE notifications 
SET user_id = 'YOUR_REAL_USER_ID_HERE'
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31';

-- Update ai_insights (if any)
UPDATE ai_insights 
SET user_id = 'YOUR_REAL_USER_ID_HERE'
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31';

-- Update notification_schedules (if any)
UPDATE notification_schedules 
SET user_id = 'YOUR_REAL_USER_ID_HERE'
WHERE user_id = '0d29164e-53f6-4a05-a070-e8cae3f7ec31';

-- ================================================
-- STEP 5: Verify the updates worked
-- ================================================

SELECT 
  'Projects updated:' as check_type,
  COUNT(*) as count
FROM projects 
WHERE owner_id = 'YOUR_REAL_USER_ID_HERE'

UNION ALL

SELECT 
  'Recordings updated:',
  COUNT(*)
FROM recording_sessions 
WHERE user_id = 'YOUR_REAL_USER_ID_HERE'

UNION ALL

SELECT 
  'Tasks accessible:',
  COUNT(*)
FROM tasks 
WHERE project_id IN (
  SELECT id FROM projects WHERE owner_id = 'YOUR_REAL_USER_ID_HERE'
)

UNION ALL

SELECT 
  'Activities updated:',
  COUNT(*)
FROM activity_log 
WHERE user_id = 'YOUR_REAL_USER_ID_HERE';

-- ================================================
-- STEP 6: Re-enable RLS with correct policies
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

-- ================================================
-- DONE! Now test in your app:
-- ================================================
-- 1. Refresh your app (or logout/login)
-- 2. You should see YOUR projects/tasks/recordings
-- 3. Login as other user - they should see ZERO of your data
-- ================================================

