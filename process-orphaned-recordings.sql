-- ============================================================================
-- PROCESS ORPHANED RECORDINGS
-- ============================================================================
-- This script finds recording sessions that don't have associated meetings
-- and creates meetings for them (if they have transcriptions)
-- ============================================================================

-- Find orphaned recording sessions (have transcription but no meeting)
WITH orphaned_recordings AS (
  SELECT 
    rs.id as recording_session_id,
    rs.user_id,
    rs.title,
    rs.transcription_text,
    rs.transcription_status,
    rs.transcription_confidence,
    rs.duration,
    rs.created_at,
    rs.metadata,
    rs.file_path
  FROM recording_sessions rs
  LEFT JOIN meetings m ON m.recording_session_id = rs.id
  WHERE m.id IS NULL
    AND rs.transcription_status = 'completed'
    AND rs.transcription_text IS NOT NULL
    AND rs.transcription_text != ''
)
SELECT 
  recording_session_id,
  user_id,
  title,
  created_at,
  transcription_status,
  CASE 
    WHEN transcription_text IS NOT NULL THEN 'Has transcription - can create meeting'
    ELSE 'No transcription - cannot create meeting'
  END as status
FROM orphaned_recordings;

-- ============================================================================
-- OPTION 1: Create meetings for orphaned recordings with transcriptions
-- ============================================================================
-- Uncomment and run this to automatically create meetings for orphaned recordings
-- WARNING: This will create meetings with basic titles. You may want to run
-- AI processing on them afterward.

/*
INSERT INTO meetings (
  title,
  description,
  scheduled_at,
  duration,
  recording_session_id,
  summary,
  action_items,
  ai_insights,
  created_at,
  updated_at
)
SELECT 
  COALESCE(rs.title, 'Recording - ' || TO_CHAR(rs.created_at, 'MM/DD/YYYY')) as title,
  'Recording from ' || TO_CHAR(rs.created_at, 'MM/DD/YYYY HH24:MI') as description,
  rs.created_at as scheduled_at,
  COALESCE(rs.duration, 30) as duration,
  rs.id as recording_session_id,
  LEFT(rs.transcription_text, 500) || '...' as summary,  -- First 500 chars as summary
  '[]'::jsonb as action_items,
  jsonb_build_object(
    'processed_at', NOW(),
    'transcription_provider', 'assemblyai',
    'confidence', COALESCE(rs.transcription_confidence, 0.8),
    'needs_ai_processing', true
  ) as ai_insights,
  rs.created_at,
  rs.updated_at
FROM recording_sessions rs
LEFT JOIN meetings m ON m.recording_session_id = rs.id
WHERE m.id IS NULL
  AND rs.transcription_status = 'completed'
  AND rs.transcription_text IS NOT NULL
  AND rs.transcription_text != ''
  AND LENGTH(rs.transcription_text) > 50;  -- Only if transcription has meaningful content
*/

-- ============================================================================
-- OPTION 2: Mark orphaned recordings for reprocessing
-- ============================================================================
-- This resets the AI processing flag so they can be reprocessed

/*
UPDATE recording_sessions
SET 
  ai_processed = false,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('needs_reprocessing', true)
WHERE id IN (
  SELECT rs.id
  FROM recording_sessions rs
  LEFT JOIN meetings m ON m.recording_session_id = rs.id
  WHERE m.id IS NULL
    AND rs.transcription_status = 'completed'
    AND rs.transcription_text IS NOT NULL
);
*/

-- ============================================================================
-- OPTION 3: Delete orphaned recordings (if you don't want them)
-- ============================================================================
-- WARNING: This will permanently delete recordings without meetings
-- Only use if you're sure you don't need them!

/*
DELETE FROM recording_sessions
WHERE id IN (
  SELECT rs.id
  FROM recording_sessions rs
  LEFT JOIN meetings m ON m.recording_session_id = rs.id
  WHERE m.id IS NULL
);
*/

