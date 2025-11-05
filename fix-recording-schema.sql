-- ============================================================================
-- FIX RECORDING SESSIONS TABLE SCHEMA
-- Run this in Supabase SQL Editor if your recording_sessions table has wrong columns
-- ============================================================================

-- Check if we need to migrate old schema
DO $$
BEGIN
  -- Check if old columns exist (status, transcript, summary)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recording_sessions' 
    AND column_name = 'status'
  ) THEN
    -- Add new columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'recording_sessions' 
      AND column_name = 'transcription_status'
    ) THEN
      ALTER TABLE recording_sessions 
      ADD COLUMN transcription_status VARCHAR DEFAULT 'pending' 
      CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'recording_sessions' 
      AND column_name = 'transcription_text'
    ) THEN
      ALTER TABLE recording_sessions ADD COLUMN transcription_text TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'recording_sessions' 
      AND column_name = 'transcription_confidence'
    ) THEN
      ALTER TABLE recording_sessions ADD COLUMN transcription_confidence DECIMAL(3,2);
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'recording_sessions' 
      AND column_name = 'ai_processed'
    ) THEN
      ALTER TABLE recording_sessions ADD COLUMN ai_processed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'recording_sessions' 
      AND column_name = 'processing_error'
    ) THEN
      ALTER TABLE recording_sessions ADD COLUMN processing_error TEXT;
    END IF;
    
    -- Migrate data from old columns to new columns
    UPDATE recording_sessions 
    SET 
      transcription_status = COALESCE(status, 'pending'),
      transcription_text = transcript,
      transcription_confidence = NULL
    WHERE transcription_status IS NULL OR transcription_status = 'pending';
    
    -- Drop old columns (optional - comment out if you want to keep them)
    -- ALTER TABLE recording_sessions DROP COLUMN IF EXISTS status;
    -- ALTER TABLE recording_sessions DROP COLUMN IF EXISTS transcript;
    -- ALTER TABLE recording_sessions DROP COLUMN IF EXISTS summary;
    
    RAISE NOTICE 'Migration completed: Old columns migrated to new schema';
  ELSE
    RAISE NOTICE 'Table already has correct schema or table does not exist';
  END IF;
END $$;

-- Ensure title and file_path are NOT NULL
ALTER TABLE recording_sessions 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN file_path SET NOT NULL;

-- Ensure metadata has default value
ALTER TABLE recording_sessions 
  ALTER COLUMN metadata SET DEFAULT '{}';

