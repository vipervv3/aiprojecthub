-- Step 1: Check meetings table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'meetings'
ORDER BY ordinal_position;

-- Step 2: Check if created_by column exists
-- If it doesn't exist, we need to add it or modify the policies

-- Step 3: Drop all existing policies on meetings table
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
DROP POLICY IF EXISTS "Users can view their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON meetings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON meetings;
DROP POLICY IF EXISTS "Enable read access for all users" ON meetings;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON meetings;

-- Step 4: Create simple permissive policies
-- Allow all authenticated users to insert meetings
CREATE POLICY "Allow authenticated inserts"
ON meetings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to view meetings
CREATE POLICY "Allow authenticated selects"
ON meetings
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to update meetings
CREATE POLICY "Allow authenticated updates"
ON meetings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 5: Fix recording_sessions table
DROP POLICY IF EXISTS "Users can create recording sessions" ON recording_sessions;
DROP POLICY IF EXISTS "Users can view recording sessions" ON recording_sessions;
DROP POLICY IF EXISTS "Users can update recording sessions" ON recording_sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON recording_sessions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON recording_sessions;

CREATE POLICY "Allow authenticated inserts"
ON recording_sessions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated selects"
ON recording_sessions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated updates"
ON recording_sessions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 6: Verify policies were created
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('meetings', 'recording_sessions')
ORDER BY tablename, policyname;




