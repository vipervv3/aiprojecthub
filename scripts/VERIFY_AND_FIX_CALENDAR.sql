-- Verify and Fix Calendar Sync Tables
-- Run this in Supabase SQL Editor

-- 1. First, let's see what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'synced_events'
ORDER BY ordinal_position;

-- 2. Add missing columns (safe to run even if they exist)
ALTER TABLE synced_events 
ADD COLUMN IF NOT EXISTS organizer TEXT,
ADD COLUMN IF NOT EXISTS attendees TEXT[],
ADD COLUMN IF NOT EXISTS recurrence TEXT;

-- 3. Verify the fix worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'synced_events'
ORDER BY ordinal_position;

-- 4. Check if any events were imported
SELECT COUNT(*) as total_synced_events FROM synced_events;

-- 5. If count is 0, we'll need to re-sync after fixing columns




