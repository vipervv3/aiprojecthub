-- Calendar Sync Setup
-- This creates tables and policies for external calendar synchronization

-- 1. Create calendar_syncs table
CREATE TABLE IF NOT EXISTS calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('outlook', 'google', 'apple', 'other')),
  ics_url TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  enabled BOOLEAN DEFAULT true,
  last_synced TIMESTAMPTZ,
  sync_interval INTEGER DEFAULT 3600, -- seconds, default 1 hour
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create synced_events table (cache of external events)
CREATE TABLE IF NOT EXISTS synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES calendar_syncs(id) ON DELETE CASCADE,
  external_uid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  organizer TEXT,
  attendees TEXT[],
  all_day BOOLEAN DEFAULT false,
  recurrence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sync_id, external_uid)
);

-- 3. Enable RLS
ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_events ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can insert their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can update their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can delete their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can view synced events from their syncs" ON synced_events;
DROP POLICY IF EXISTS "Allow insert synced events" ON synced_events;
DROP POLICY IF EXISTS "Allow update synced events" ON synced_events;
DROP POLICY IF EXISTS "Allow delete synced events" ON synced_events;

-- 5. Create RLS policies for calendar_syncs
CREATE POLICY "Users can view their own calendar syncs"
  ON calendar_syncs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own calendar syncs"
  ON calendar_syncs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own calendar syncs"
  ON calendar_syncs FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own calendar syncs"
  ON calendar_syncs FOR DELETE
  USING (true);

-- 6. Create RLS policies for synced_events
CREATE POLICY "Users can view synced events from their syncs"
  ON synced_events FOR SELECT
  USING (true);

CREATE POLICY "Allow insert synced events"
  ON synced_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update synced events"
  ON synced_events FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete synced events"
  ON synced_events FOR DELETE
  USING (true);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_id ON calendar_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_enabled ON calendar_syncs(enabled);
CREATE INDEX IF NOT EXISTS idx_synced_events_sync_id ON synced_events(sync_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_start_time ON synced_events(start_time);

-- 8. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_calendar_syncs_updated_at ON calendar_syncs;
CREATE TRIGGER update_calendar_syncs_updated_at
  BEFORE UPDATE ON calendar_syncs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_synced_events_updated_at ON synced_events;
CREATE TRIGGER update_synced_events_updated_at
  BEFORE UPDATE ON synced_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Add meeting_source column to meetings table to distinguish recording meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_source TEXT DEFAULT 'manual' CHECK (meeting_source IN ('manual', 'recording', 'synced'));

-- 10. Update existing recording meetings
UPDATE meetings 
SET meeting_source = 'recording' 
WHERE meeting_type = 'recording' OR id IN (
  SELECT DISTINCT metadata->>'meetingId' 
  FROM recording_sessions 
  WHERE metadata->>'meetingId' IS NOT NULL
);




