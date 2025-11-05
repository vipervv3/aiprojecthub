-- ============================================================================
-- VERIFY MEETINGS TABLE SCHEMA
-- ============================================================================
-- Run this to verify all required columns exist
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔍 VERIFYING MEETINGS TABLE SCHEMA';
  RAISE NOTICE '%', repeat('=', 61);
  RAISE NOTICE '';
END $$;

DO $$
DECLARE
  has_participants BOOLEAN;
  has_attendees BOOLEAN;
  has_ai_insights BOOLEAN;
  has_summary BOOLEAN;
  has_action_items BOOLEAN;
  has_meeting_type BOOLEAN;
  has_project_id BOOLEAN;
  has_recording_session_id BOOLEAN;
  has_status BOOLEAN;
  all_columns_exist BOOLEAN := TRUE;
BEGIN
  -- Check each column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'participants'
  ) INTO has_participants;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'attendees'
  ) INTO has_attendees;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'ai_insights'
  ) INTO has_ai_insights;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'summary'
  ) INTO has_summary;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'action_items'
  ) INTO has_action_items;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'meeting_type'
  ) INTO has_meeting_type;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'project_id'
  ) INTO has_project_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'recording_session_id'
  ) INTO has_recording_session_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'status'
  ) INTO has_status;
  
  -- Report results
  IF has_participants THEN
    RAISE NOTICE '✅ Column "participants" exists';
  ELSE
    RAISE NOTICE '❌ Column "participants" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_attendees THEN
    RAISE NOTICE '✅ Column "attendees" exists';
  ELSE
    RAISE NOTICE '❌ Column "attendees" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_ai_insights THEN
    RAISE NOTICE '✅ Column "ai_insights" exists';
  ELSE
    RAISE NOTICE '❌ Column "ai_insights" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_summary THEN
    RAISE NOTICE '✅ Column "summary" exists';
  ELSE
    RAISE NOTICE '❌ Column "summary" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_action_items THEN
    RAISE NOTICE '✅ Column "action_items" exists';
  ELSE
    RAISE NOTICE '❌ Column "action_items" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_meeting_type THEN
    RAISE NOTICE '✅ Column "meeting_type" exists';
  ELSE
    RAISE NOTICE '❌ Column "meeting_type" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_project_id THEN
    RAISE NOTICE '✅ Column "project_id" exists';
  ELSE
    RAISE NOTICE '❌ Column "project_id" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_recording_session_id THEN
    RAISE NOTICE '✅ Column "recording_session_id" exists';
  ELSE
    RAISE NOTICE '❌ Column "recording_session_id" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  IF has_status THEN
    RAISE NOTICE '✅ Column "status" exists';
  ELSE
    RAISE NOTICE '❌ Column "status" MISSING';
    all_columns_exist := FALSE;
  END IF;
  
  RAISE NOTICE '';
  IF all_columns_exist THEN
    RAISE NOTICE '%', repeat('=', 61);
    RAISE NOTICE '✅ ALL REQUIRED COLUMNS EXIST!';
    RAISE NOTICE '   The meetings table schema is correct.';
    RAISE NOTICE '   Recording processing should work now.';
    RAISE NOTICE '%', repeat('=', 61);
  ELSE
    RAISE NOTICE '%', repeat('=', 61);
    RAISE NOTICE '❌ SOME COLUMNS ARE MISSING!';
    RAISE NOTICE '   Please run fix-meetings-schema.sql again.';
    RAISE NOTICE '%', repeat('=', 61);
  END IF;
END $$;

