-- Fix existing meetings to link them with their recording sessions
-- This updates meetings that have a corresponding recording session but no link

UPDATE meetings m
SET recording_session_id = rs.id
FROM recording_sessions rs
WHERE rs.metadata->>'meetingId' = m.id::text
  AND m.recording_session_id IS NULL;

-- Verify the fix
SELECT 
  COUNT(*) as total_meetings,
  COUNT(recording_session_id) as meetings_with_recordings
FROM meetings;

-- Show sample linked recordings
SELECT 
  m.id,
  m.title,
  m.scheduled_at,
  m.recording_session_id,
  rs.transcription_status
FROM meetings m
LEFT JOIN recording_sessions rs ON rs.id = m.recording_session_id
WHERE m.recording_session_id IS NOT NULL
ORDER BY m.scheduled_at DESC
LIMIT 10;




