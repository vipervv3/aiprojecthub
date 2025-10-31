-- ============================================
-- RECORDING SYSTEM DIAGNOSTIC
-- This script checks EVERYTHING needed for recording
-- Copy the output and send it to identify issues
-- ============================================

-- Setup for pretty output
\set QUIET on
\timing off

DO $$ 
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════╗';
  RAISE NOTICE '║   RECORDING SYSTEM DIAGNOSTIC REPORT          ║';
  RAISE NOTICE '╚════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- ============================================
-- 1. CHECK TABLES EXIST
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '1. TABLES CHECK';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
    RAISE NOTICE '✅ meetings table exists';
  ELSE
    RAISE NOTICE '❌ meetings table MISSING';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recording_sessions') THEN
    RAISE NOTICE '✅ recording_sessions table exists';
  ELSE
    RAISE NOTICE '❌ recording_sessions table MISSING';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_tasks') THEN
    RAISE NOTICE '✅ meeting_tasks table exists';
  ELSE
    RAISE NOTICE '❌ meeting_tasks table MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    RAISE NOTICE '✅ projects table exists';
  ELSE
    RAISE NOTICE '❌ projects table MISSING';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 2. CHECK MEETINGS TABLE COLUMNS
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '2. MEETINGS TABLE COLUMNS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'user_id') THEN
    RAISE NOTICE '✅ meetings.user_id exists';
  ELSE
    RAISE NOTICE '❌ meetings.user_id MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'project_id') THEN
    RAISE NOTICE '✅ meetings.project_id exists';
  ELSE
    RAISE NOTICE '❌ meetings.project_id MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'recording_url') THEN
    RAISE NOTICE '✅ meetings.recording_url exists';
  ELSE
    RAISE NOTICE '❌ meetings.recording_url MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'status') THEN
    RAISE NOTICE '✅ meetings.status exists';
  ELSE
    RAISE NOTICE '❌ meetings.status MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 3. CHECK RECORDING_SESSIONS COLUMNS
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '3. RECORDING_SESSIONS TABLE COLUMNS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recording_sessions' AND column_name = 'audio_url') THEN
    RAISE NOTICE '✅ recording_sessions.audio_url exists';
  ELSE
    RAISE NOTICE '❌ recording_sessions.audio_url MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recording_sessions' AND column_name = 'duration_seconds') THEN
    RAISE NOTICE '✅ recording_sessions.duration_seconds exists';
  ELSE
    RAISE NOTICE '❌ recording_sessions.duration_seconds MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recording_sessions' AND column_name = 'user_id') THEN
    RAISE NOTICE '✅ recording_sessions.user_id exists';
  ELSE
    RAISE NOTICE '❌ recording_sessions.user_id MISSING';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 4. CHECK RLS POLICIES
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '4. RLS POLICIES';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

DO $$ 
DECLARE 
  policy_count INTEGER;
BEGIN
  -- Check meetings policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'meetings' AND cmd = 'SELECT';
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ meetings SELECT policy exists';
  ELSE
    RAISE NOTICE '❌ meetings SELECT policy MISSING';
  END IF;
  
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'meetings' AND cmd = 'INSERT';
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ meetings INSERT policy exists';
  ELSE
    RAISE NOTICE '❌ meetings INSERT policy MISSING';
  END IF;
  
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'meetings' AND cmd = 'DELETE';
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ meetings DELETE policy exists';
  ELSE
    RAISE NOTICE '❌ meetings DELETE policy MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  -- Check recording_sessions policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'recording_sessions' AND cmd = 'DELETE';
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ recording_sessions DELETE policy exists';
  ELSE
    RAISE NOTICE '❌ recording_sessions DELETE policy MISSING - run COMPLETE-RECORDING-FIX.sql';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 5. CHECK STORAGE BUCKET
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '5. STORAGE BUCKET';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

DO $$ 
DECLARE 
  bucket_exists BOOLEAN;
  is_public BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'recordings') INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT public INTO is_public FROM storage.buckets WHERE name = 'recordings';
    IF is_public THEN
      RAISE NOTICE '✅ Storage bucket "recordings" exists and is PUBLIC';
    ELSE
      RAISE NOTICE '⚠️  Storage bucket "recordings" exists but is PRIVATE';
      RAISE NOTICE '   → Make it public in Supabase Dashboard → Storage';
    END IF;
  ELSE
    RAISE NOTICE '❌ Storage bucket "recordings" MISSING';
    RAISE NOTICE '   → Create it: Supabase Dashboard → Storage → New Bucket';
    RAISE NOTICE '   → Name: recordings (lowercase)';
    RAISE NOTICE '   → Set to PUBLIC';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 6. CHECK USER AND PROJECTS
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '6. USER AND PROJECTS';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

DO $$ 
DECLARE 
  current_user_id UUID;
  project_count INTEGER;
BEGIN
  -- Check current user
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NOT NULL THEN
    RAISE NOTICE '✅ Current user ID: %', current_user_id;
    
    -- Check projects
    SELECT COUNT(*) INTO project_count FROM projects WHERE owner_id = current_user_id;
    IF project_count > 0 THEN
      RAISE NOTICE '✅ User has % project(s)', project_count;
    ELSE
      RAISE NOTICE '⚠️  User has NO projects';
      RAISE NOTICE '   → Create a project first before recording';
    END IF;
  ELSE
    RAISE NOTICE '❌ No authenticated user (run this while logged in)';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 7. CHECK EXISTING DATA
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '7. EXISTING DATA';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

DO $$ 
DECLARE 
  meeting_count INTEGER;
  recording_count INTEGER;
  null_user_id_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO meeting_count FROM meetings;
  SELECT COUNT(*) INTO recording_count FROM recording_sessions;
  SELECT COUNT(*) INTO null_user_id_count FROM meetings WHERE user_id IS NULL;
  
  RAISE NOTICE 'Total meetings: %', meeting_count;
  RAISE NOTICE 'Total recording sessions: %', recording_count;
  
  IF null_user_id_count > 0 THEN
    RAISE NOTICE '⚠️  % meeting(s) have NULL user_id', null_user_id_count;
    RAISE NOTICE '   → Run COMPLETE-RECORDING-FIX.sql to backfill';
  ELSE
    RAISE NOTICE '✅ All meetings have user_id';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- FINAL SUMMARY
-- ============================================
DO $$ 
DECLARE 
  issues_found INTEGER := 0;
BEGIN
  RAISE NOTICE '╔════════════════════════════════════════════════╗';
  RAISE NOTICE '║   DIAGNOSTIC SUMMARY                           ║';
  RAISE NOTICE '╚════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  -- Count issues
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'user_id') THEN
    issues_found := issues_found + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'recordings') THEN
    issues_found := issues_found + 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND cmd = 'DELETE') THEN
    issues_found := issues_found + 1;
  END IF;
  
  IF issues_found = 0 THEN
    RAISE NOTICE '🎉 ALL SYSTEMS GO! Recording should work!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Try recording a test meeting';
    RAISE NOTICE '2. If it fails, check browser console (F12)';
    RAISE NOTICE '3. Send console errors for debugging';
  ELSE
    RAISE NOTICE '⚠️  FOUND % ISSUE(S) - See details above', issues_found;
    RAISE NOTICE '';
    RAISE NOTICE 'To fix:';
    RAISE NOTICE '1. Run scripts/COMPLETE-RECORDING-FIX.sql';
    RAISE NOTICE '2. Create storage bucket "recordings" if missing';
    RAISE NOTICE '3. Run this diagnostic again to verify';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════';
END $$;

-- Show recent meetings for debugging
SELECT 
  '━━━━━ RECENT MEETINGS (for debugging) ━━━━━' as info;

SELECT 
  id,
  title,
  CASE 
    WHEN user_id IS NULL THEN '❌ NULL'
    ELSE '✅ ' || LEFT(user_id::text, 8) || '...'
  END as user_id_status,
  CASE 
    WHEN project_id IS NULL THEN '❌ NULL'
    ELSE '✅ ' || LEFT(project_id::text, 8) || '...'
  END as project_id_status,
  created_at
FROM meetings
ORDER BY created_at DESC
LIMIT 5;





