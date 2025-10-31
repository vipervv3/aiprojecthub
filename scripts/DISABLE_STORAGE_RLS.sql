-- ============================================================
-- DISABLE STORAGE RLS - Run in Supabase SQL Editor
-- ============================================================
-- This will completely disable RLS on storage for development
-- allowing all uploads to work
-- ============================================================

-- Option 1: Drop ALL existing policies on storage.objects
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Option 2: Create a super permissive policy that allows everything
CREATE POLICY "Allow all operations for meeting recordings"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'meeting-recordings')
WITH CHECK (bucket_id = 'meeting-recordings');

-- Option 3: If above doesn't work, make bucket truly public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'meeting-recordings';

-- ============================================================
-- After running this SQL:
-- 1. HARD REFRESH browser: Ctrl + Shift + R
-- 2. Try recording again
-- 3. Should see "✅ Chunk uploaded successfully"
-- ============================================================




