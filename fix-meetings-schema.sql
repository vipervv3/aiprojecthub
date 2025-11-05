-- ============================================================================
-- FIX MEETINGS TABLE SCHEMA
-- ============================================================================
-- This script adds missing columns to the meetings table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new
-- ============================================================================

DO $$
BEGIN
  -- Add participants column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'participants'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN participants JSONB DEFAULT '[]';
    RAISE NOTICE '✅ Added "participants" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "participants" already exists';
  END IF;

  -- Add attendees column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'attendees'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN attendees JSONB DEFAULT '[]';
    RAISE NOTICE '✅ Added "attendees" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "attendees" already exists';
  END IF;

  -- Add ai_insights column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'ai_insights'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN ai_insights JSONB DEFAULT '{}';
    RAISE NOTICE '✅ Added "ai_insights" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "ai_insights" already exists';
  END IF;

  -- Add summary column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'summary'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN summary TEXT;
    RAISE NOTICE '✅ Added "summary" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "summary" already exists';
  END IF;

  -- Add action_items column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'action_items'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN action_items JSONB DEFAULT '[]';
    RAISE NOTICE '✅ Added "action_items" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "action_items" already exists';
  END IF;

  -- Add meeting_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'meeting_type'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN meeting_type VARCHAR DEFAULT 'regular';
    ALTER TABLE public.meetings ADD CONSTRAINT meetings_meeting_type_check 
      CHECK (meeting_type IN ('regular', 'standup', 'review', 'planning'));
    RAISE NOTICE '✅ Added "meeting_type" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "meeting_type" already exists';
  END IF;

  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added "project_id" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "project_id" already exists';
  END IF;

  -- Add recording_session_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meetings' AND column_name = 'recording_session_id'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN recording_session_id UUID REFERENCES recording_sessions(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added "recording_session_id" column to meetings table';
  ELSE
    RAISE NOTICE '✅ Column "recording_session_id" already exists';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ MEETINGS TABLE SCHEMA FIX COMPLETE!';
  RAISE NOTICE '   All required columns should now be present.';
  RAISE NOTICE '';
END $$;

