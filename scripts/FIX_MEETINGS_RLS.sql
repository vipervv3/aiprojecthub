-- Fix RLS policies for meetings table to allow recording creation

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON meetings;

-- Enable RLS on meetings table
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view meetings they created or are invited to
CREATE POLICY "Users can view their own meetings"
ON meetings
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = created_by 
  OR 
  auth.uid()::text IN (
    SELECT unnest(participants)
  )
);

-- Policy: Users can create meetings (will auto-set created_by)
CREATE POLICY "Users can create meetings"
ON meetings
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow all authenticated users to create meetings

-- Policy: Users can update their own meetings
CREATE POLICY "Users can update their own meetings"
ON meetings
FOR UPDATE
TO authenticated
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

-- Policy: Users can delete their own meetings
CREATE POLICY "Users can delete their own meetings"
ON meetings
FOR DELETE
TO authenticated
USING (auth.uid()::text = created_by);

-- Also fix recording_sessions table
DROP POLICY IF EXISTS "Users can view their own recording sessions" ON recording_sessions;
DROP POLICY IF EXISTS "Users can create their own recording sessions" ON recording_sessions;
DROP POLICY IF EXISTS "Users can update their own recording sessions" ON recording_sessions;

ALTER TABLE recording_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recording sessions"
ON recording_sessions
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own recording sessions"
ON recording_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own recording sessions"
ON recording_sessions
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('meetings', 'recording_sessions')
ORDER BY tablename, policyname;




