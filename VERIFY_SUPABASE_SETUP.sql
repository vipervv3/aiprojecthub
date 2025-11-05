-- ============================================================================
-- SUPABASE SETUP VERIFICATION SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor to verify everything is set up correctly
-- Go to: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 SUPABASE SETUP VERIFICATION';
  RAISE NOTICE '%', repeat('=', 61);
END $$;

-- ============================================================================
-- 1. CHECK DATABASE TABLES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 1. DATABASE TABLES';
  RAISE NOTICE '%', repeat('-', 61);
END $$;

DO $$
DECLARE
  table_name TEXT;
  table_exists BOOLEAN;
  required_tables TEXT[] := ARRAY[
    'users', 'projects', 'tasks', 'recording_sessions', 
    'meetings', 'meeting_tasks', 'ai_insights', 'notifications'
  ];
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) INTO table_exists;
    
    IF table_exists THEN
      RAISE NOTICE '   ✅ Table "%" exists', table_name;
    ELSE
      RAISE NOTICE '   ❌ Table "%" MISSING!', table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 2. CHECK STORAGE BUCKET
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📦 2. STORAGE BUCKET';
  RAISE NOTICE '%', repeat('-', 61);
END $$;

DO $$
DECLARE
  bucket_exists BOOLEAN;
  is_public BOOLEAN;
  bucket_id UUID;
  file_count INTEGER;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'meeting-recordings'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public, id INTO is_public, bucket_id
    FROM storage.buckets 
    WHERE name = 'meeting-recordings';
    
    RAISE NOTICE '   ✅ Bucket "meeting-recordings" EXISTS';
    RAISE NOTICE '      - ID: %', bucket_id;
    RAISE NOTICE '      - Public: %', CASE WHEN is_public THEN '✅ YES' ELSE '❌ NO - CRITICAL!' END;
    
    IF NOT is_public THEN
      RAISE NOTICE '';
      RAISE NOTICE '   🚨 CRITICAL: Bucket is NOT public!';
      RAISE NOTICE '   AssemblyAI cannot access recording files if bucket is private.';
      RAISE NOTICE '   Fix: Supabase Dashboard → Storage → meeting-recordings → Settings → Make Public';
    END IF;
    
    -- Count files
    SELECT COUNT(*) INTO file_count
    FROM storage.objects
    WHERE bucket_id = bucket_id;
    
    RAISE NOTICE '      - Files: % file(s)', file_count;
    
  ELSE
    RAISE NOTICE '   ❌ Bucket "meeting-recordings" NOT FOUND!';
    RAISE NOTICE '';
    RAISE NOTICE '   Fix:';
    RAISE NOTICE '   1. Go to Supabase Dashboard → Storage';
    RAISE NOTICE '   2. Click "New bucket"';
    RAISE NOTICE '   3. Name: meeting-recordings';
    RAISE NOTICE '   4. Make it PUBLIC (critical!)';
    RAISE NOTICE '   5. Save';
  END IF;
END $$;

-- ============================================================================
-- 3. CHECK RECORDING SESSIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎙️  3. RECORDING SESSIONS';
  RAISE NOTICE '%', repeat('-', 61);
END $$;

DO $$
DECLARE
  total_count INTEGER;
  pending_count INTEGER;
  processing_count INTEGER;
  completed_count INTEGER;
  failed_count INTEGER;
  ai_processed_count INTEGER;
  with_files INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM recording_sessions;
  SELECT COUNT(*) INTO pending_count FROM recording_sessions WHERE transcription_status = 'pending';
  SELECT COUNT(*) INTO processing_count FROM recording_sessions WHERE transcription_status = 'processing';
  SELECT COUNT(*) INTO completed_count FROM recording_sessions WHERE transcription_status = 'completed';
  SELECT COUNT(*) INTO failed_count FROM recording_sessions WHERE transcription_status = 'failed';
  SELECT COUNT(*) INTO ai_processed_count FROM recording_sessions WHERE ai_processed = true;
  SELECT COUNT(*) INTO with_files FROM recording_sessions WHERE file_path IS NOT NULL;
  
  RAISE NOTICE '   Total recordings: %', total_count;
  RAISE NOTICE '   - Pending: %', pending_count;
  RAISE NOTICE '   - Processing: %', processing_count;
  RAISE NOTICE '   - Completed: %', completed_count;
  RAISE NOTICE '   - Failed: %', failed_count;
  RAISE NOTICE '   - AI Processed: %', ai_processed_count;
  RAISE NOTICE '   - With files: %', with_files;
  
  IF processing_count > 0 OR pending_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '   ⚠️  Some recordings are still being transcribed';
    RAISE NOTICE '   Client-side polling will check and update status automatically';
  END IF;
END $$;

-- ============================================================================
-- 4. CHECK MEETINGS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📅 4. MEETINGS';
  RAISE NOTICE '%', repeat('-', 61);
END $$;

DO $$
DECLARE
  total_meetings INTEGER;
  with_recordings INTEGER;
  with_summaries INTEGER;
  with_tasks INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_meetings FROM meetings;
  SELECT COUNT(*) INTO with_recordings FROM meetings WHERE recording_session_id IS NOT NULL;
  SELECT COUNT(*) INTO with_summaries FROM meetings WHERE summary IS NOT NULL;
  
  SELECT COUNT(DISTINCT meeting_id) INTO with_tasks
  FROM meeting_tasks;
  
  RAISE NOTICE '   Total meetings: %', total_meetings;
  RAISE NOTICE '   - With recordings: %', with_recordings;
  RAISE NOTICE '   - With summaries: %', with_summaries;
  RAISE NOTICE '   - With tasks: %', with_tasks;
END $$;

-- ============================================================================
-- 5. CHECK ORPHANED RECORDINGS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 5. ORPHANED RECORDINGS';
  RAISE NOTICE '%', repeat('-', 61);
END $$;

DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM recording_sessions rs
  LEFT JOIN meetings m ON m.recording_session_id = rs.id
  WHERE rs.transcription_status = 'completed'
    AND rs.transcription_text IS NOT NULL
    AND rs.ai_processed = false
    AND m.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE '   ⚠️  Found % orphaned recording(s) ready for processing', orphaned_count;
    RAISE NOTICE '   These will be auto-processed when you visit the Meetings page';
    RAISE NOTICE '   Or run: process-orphaned-recordings.sql';
  ELSE
    RAISE NOTICE '   ✅ No orphaned recordings found';
  END IF;
END $$;

-- ============================================================================
-- 6. CHECK STORAGE BUCKET PERMISSIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 6. STORAGE BUCKET PERMISSIONS';
  RAISE NOTICE '%', repeat('-', 61);
END $$;

DO $$
DECLARE
  bucket_id UUID;
  has_select_policy BOOLEAN;
  has_insert_policy BOOLEAN;
BEGIN
  SELECT id INTO bucket_id
  FROM storage.buckets 
  WHERE name = 'meeting-recordings';
  
  IF bucket_id IS NOT NULL THEN
    -- Check for SELECT policy (public read)
    SELECT EXISTS (
      SELECT 1 FROM storage.policies
      WHERE bucket_id = bucket_id
      AND name LIKE '%SELECT%'
      AND definition LIKE '%public%'
    ) INTO has_select_policy;
    
    -- Check for INSERT policy
    SELECT EXISTS (
      SELECT 1 FROM storage.policies
      WHERE bucket_id = bucket_id
      AND name LIKE '%INSERT%'
    ) INTO has_insert_policy;
    
    RAISE NOTICE '   Bucket policies:';
    RAISE NOTICE '   - SELECT (public read): %', CASE WHEN has_select_policy THEN '✅' ELSE '⚠️  May need policy' END;
    RAISE NOTICE '   - INSERT: %', CASE WHEN has_insert_policy THEN '✅' ELSE '⚠️  May need policy' END;
    
    -- If bucket is public, policies might not be needed
    DECLARE
      is_public BOOLEAN;
    BEGIN
      SELECT public INTO is_public FROM storage.buckets WHERE id = bucket_id;
      IF is_public THEN
        RAISE NOTICE '   ✅ Bucket is PUBLIC - policies may not be required';
      ELSE
        RAISE NOTICE '   ⚠️  Bucket is PRIVATE - policies are required';
      END IF;
    END;
  END IF;
END $$;

-- ============================================================================
-- 7. CHECK RECORDING SESSION SCHEMA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 7. RECORDING SESSIONS SCHEMA';
  RAISE NOTICE '%', repeat('-', 61);
END $$;

DO $$
DECLARE
  has_transcription_status BOOLEAN;
  has_transcription_text BOOLEAN;
  has_transcription_confidence BOOLEAN;
  has_ai_processed BOOLEAN;
  has_file_path BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recording_sessions' AND column_name = 'transcription_status'
  ) INTO has_transcription_status;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recording_sessions' AND column_name = 'transcription_text'
  ) INTO has_transcription_text;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recording_sessions' AND column_name = 'transcription_confidence'
  ) INTO has_transcription_confidence;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recording_sessions' AND column_name = 'ai_processed'
  ) INTO has_ai_processed;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recording_sessions' AND column_name = 'file_path'
  ) INTO has_file_path;
  
  RAISE NOTICE '   Required columns:';
  RAISE NOTICE '   - transcription_status: %', CASE WHEN has_transcription_status THEN '✅' ELSE '❌ MISSING' END;
  RAISE NOTICE '   - transcription_text: %', CASE WHEN has_transcription_text THEN '✅' ELSE '❌ MISSING' END;
  RAISE NOTICE '   - transcription_confidence: %', CASE WHEN has_transcription_confidence THEN '✅' ELSE '❌ MISSING' END;
  RAISE NOTICE '   - ai_processed: %', CASE WHEN has_ai_processed THEN '✅' ELSE '❌ MISSING' END;
  RAISE NOTICE '   - file_path: %', CASE WHEN has_file_path THEN '✅' ELSE '❌ MISSING' END;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '%', repeat('=', 61);
  RAISE NOTICE '✅ VERIFICATION COMPLETE';
  RAISE NOTICE '%', repeat('=', 61);
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '   - Check results above for any ❌ errors';
  RAISE NOTICE '   - Most critical: Storage bucket MUST be PUBLIC';
  RAISE NOTICE '   - If orphaned recordings found, they will auto-process';
  RAISE NOTICE '   - Client-side polling will check transcription status';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- QUICK FIXES (if needed)
-- ============================================================================

-- Uncomment to make bucket public (if it's private):
/*
UPDATE storage.buckets 
SET public = true 
WHERE name = 'meeting-recordings';
*/

