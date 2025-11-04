-- Setup Supabase Storage Bucket for Meeting Recordings
-- Run this in Supabase Dashboard → SQL Editor

-- Create storage bucket (if using SQL, otherwise create via Dashboard)
-- Note: It's better to create buckets via Supabase Dashboard → Storage
-- But here are the policies for the bucket

-- 1. First create the bucket via Supabase Dashboard:
--    - Go to Storage
--    - Click "New bucket"
--    - Name: meeting-recordings
--    - Public: false (private)
--    - File size limit: 500MB
--    - Allowed MIME types: audio/webm, audio/wav, audio/mp3, audio/mpeg

-- 2. Then run these policies:

-- Allow authenticated users to upload recordings
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own recordings
CREATE POLICY "Users can read own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own recordings  
CREATE POLICY "Users can update own recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For development: Temporarily disable RLS on storage (if needed)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Update recording_sessions table to support chunked uploads
ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS chunks JSONB DEFAULT '[]';
ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS upload_progress INTEGER DEFAULT 0;
ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recording_sessions_user_id ON recording_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recording_sessions_project_id ON recording_sessions(project_id);

COMMENT ON COLUMN recording_sessions.project_id IS 'Project associated with this recording';
COMMENT ON COLUMN recording_sessions.chunks IS 'Array of uploaded chunk information';
COMMENT ON COLUMN recording_sessions.upload_progress IS 'Upload progress percentage (0-100)';
COMMENT ON COLUMN recording_sessions.storage_path IS 'Full path to the recording in Supabase Storage';

-- Create meeting_tasks join table for linking tasks to meetings
CREATE TABLE IF NOT EXISTS meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_task_id ON meeting_tasks(task_id);

COMMENT ON TABLE meeting_tasks IS 'Links tasks to meetings (many-to-many relationship)';

