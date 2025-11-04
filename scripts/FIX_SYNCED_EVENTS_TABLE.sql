-- Fix synced_events table - Add missing columns
-- Run this in Supabase SQL Editor

ALTER TABLE synced_events 
ADD COLUMN IF NOT EXISTS organizer TEXT,
ADD COLUMN IF NOT EXISTS attendees TEXT[],
ADD COLUMN IF NOT EXISTS recurrence TEXT;

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'synced_events'
ORDER BY ordinal_position;




