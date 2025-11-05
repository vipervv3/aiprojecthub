-- ============================================================================
-- PROCESS ORPHANED RECORDINGS - READY TO RUN
-- ============================================================================
-- This will create meetings for all orphaned recordings that have transcriptions
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check what we have
SELECT 
  rs.id as recording_session_id,
  rs.user_id,
  rs.title,
  rs.transcription_status,
  CASE 
    WHEN rs.transcription_status = 'completed' AND rs.transcription_text IS NOT NULL 
    THEN '✅ Can create meeting'
    ELSE '❌ Cannot create (no transcription)'
  END as status,
  LENGTH(rs.transcription_text) as transcription_length
FROM recording_sessions rs
LEFT JOIN meetings m ON m.recording_session_id = rs.id
WHERE m.id IS NULL
ORDER BY rs.created_at DESC;

-- ============================================================================
-- Step 2: Create meetings for orphaned recordings with transcriptions
-- ============================================================================
-- UNCOMMENT THE SECTION BELOW TO ACTUALLY CREATE THE MEETINGS
-- ============================================================================

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
  LEFT(rs.transcription_text, 500) || '...' as summary,
  '[]'::jsonb as action_items,
  jsonb_build_object(
    'processed_at', NOW(),
    'transcription_provider', 'assemblyai',
    'confidence', COALESCE(rs.transcription_confidence, 0.8),
    'needs_ai_processing', true,
    'note', 'Created from orphaned recording - run AI processing to extract tasks'
  ) as ai_insights,
  rs.created_at,
  rs.updated_at
FROM recording_sessions rs
LEFT JOIN meetings m ON m.recording_session_id = rs.id
WHERE m.id IS NULL
  AND rs.transcription_status = 'completed'
  AND rs.transcription_text IS NOT NULL
  AND rs.transcription_text != ''
  AND LENGTH(rs.transcription_text) > 50
RETURNING id, title, recording_session_id;
*/

-- ============================================================================
-- Step 3: After creating meetings, trigger AI processing
-- ============================================================================
-- After running Step 2, you can trigger AI processing via the UI:
-- - Go to Meetings page
-- - Click "Process" on the newly created meetings
-- - Or use the API endpoint: /api/process-recording
-- ============================================================================

