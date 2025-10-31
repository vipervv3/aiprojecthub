-- ============================================================
-- FIX STORAGE RLS POLICY - Run this in Supabase SQL Editor
-- ============================================================
-- This creates permissive policies for the storage bucket
-- so recordings can upload successfully
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for development" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Create a permissive policy for development (allows all operations)
CREATE POLICY "Allow all storage operations for development"
ON storage.objects
FOR ALL
USING (bucket_id = 'meeting-recordings')
WITH CHECK (bucket_id = 'meeting-recordings');

-- Alternative: If the above doesn't work, try making the bucket public temporarily
-- UPDATE storage.buckets SET public = true WHERE name = 'meeting-recordings';

-- ============================================================
-- After running this, refresh your browser and try recording!
-- The "row-level security policy" error should be gone.
-- ============================================================




