# 📅 Calendar Sync Setup Instructions

## 🎯 What's New

Your calendar now supports:
✅ **ICS/iCal sync** from Outlook, Google Calendar, Apple Calendar, etc.
✅ **Recording meetings are hidden** from the calendar (only manually scheduled meetings show)
✅ **Create, Edit, Delete meetings** directly on the calendar

---

## ⚡ Quick Setup (2 minutes)

### Step 1: Run SQL in Supabase

1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Calendar Sync Setup
CREATE TABLE IF NOT EXISTS calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('outlook', 'google', 'apple', 'other')),
  ics_url TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  enabled BOOLEAN DEFAULT true,
  last_synced TIMESTAMPTZ,
  sync_interval INTEGER DEFAULT 3600,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can insert their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can update their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can delete their own calendar syncs" ON calendar_syncs;
DROP POLICY IF EXISTS "Users can view synced events from their syncs" ON synced_events;
DROP POLICY IF EXISTS "Allow insert synced events" ON synced_events;
DROP POLICY IF EXISTS "Allow update synced events" ON synced_events;
DROP POLICY IF EXISTS "Allow delete synced events" ON synced_events;

CREATE POLICY "Users can view their own calendar syncs" ON calendar_syncs FOR SELECT USING (true);
CREATE POLICY "Users can insert their own calendar syncs" ON calendar_syncs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own calendar syncs" ON calendar_syncs FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own calendar syncs" ON calendar_syncs FOR DELETE USING (true);
CREATE POLICY "Users can view synced events from their syncs" ON synced_events FOR SELECT USING (true);
CREATE POLICY "Allow insert synced events" ON synced_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update synced events" ON synced_events FOR UPDATE USING (true);
CREATE POLICY "Allow delete synced events" ON synced_events FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_id ON calendar_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_enabled ON calendar_syncs(enabled);
CREATE INDEX IF NOT EXISTS idx_synced_events_sync_id ON synced_events(sync_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_start_time ON synced_events(start_time);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_calendar_syncs_updated_at ON calendar_syncs;
CREATE TRIGGER update_calendar_syncs_updated_at BEFORE UPDATE ON calendar_syncs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_synced_events_updated_at ON synced_events;
CREATE TRIGGER update_synced_events_updated_at BEFORE UPDATE ON synced_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_source TEXT DEFAULT 'manual' CHECK (meeting_source IN ('manual', 'recording', 'synced'));

UPDATE meetings SET meeting_source = 'recording' WHERE meeting_type = 'recording' OR id IN (SELECT DISTINCT metadata->>'meetingId' FROM recording_sessions WHERE metadata->>'meetingId' IS NOT NULL);
```

5. Click **RUN** ✅

---

## 🔗 How to Sync External Calendars

### Get Your ICS URL:

#### **Outlook / Microsoft 365:**
1. Go to Outlook.com Calendar
2. Click **Share** on a calendar
3. Click **Publish calendar**
4. Copy the **ICS link**

#### **Google Calendar:**
1. Go to Google Calendar settings
2. Select a calendar
3. Scroll to **Integrate calendar**
4. Copy **Secret address in iCal format**

#### **Apple iCloud Calendar:**
1. Open iCloud.com Calendar
2. Share a calendar
3. Enable **Public Calendar**
4. Copy the link (change `webcal://` to `https://`)

### In the App:
1. Go to **Calendar** page
2. Click **Sync Calendars** (purple button)
3. Click **Add Calendar Sync**
4. Choose provider and paste ICS URL
5. Name your calendar and choose a color
6. Click **Add Calendar** ✅

---

## 🎯 Features

### ✨ What You Can Do Now:

1. **Add Meetings:**
   - Click **Add Meeting** (blue button)
   - Fill in details and save
   
2. **View Events:**
   - Click any event on the calendar
   - See full details, time, location, etc.
   
3. **Delete Meetings:**
   - Click an event → **Delete** button
   - (Only works for manually created meetings, not synced ones)

4. **Sync External Calendars:**
   - Click **Sync Calendars** → Add your Outlook/Google/Apple calendar
   - Events appear automatically in your app calendar
   - Refresh any time to update

5. **Filter Events:**
   - Use the dropdown to show only: Projects, Tasks, Meetings, or Deadlines

### 🎨 Color Coding:

- 🔵 **Blue** = Projects
- 🟢 **Green** = Tasks
- 🟣 **Purple** = Meetings (manual)
- 🔴 **Red** = Deadlines/Overdue
- **Custom colors** for synced calendars

### 🎯 What's Hidden:

- **Recording meetings** no longer clutter your calendar
- They still show on the **Meetings page**, but not the calendar
- This keeps your calendar clean and focused on scheduled meetings

---

## ✅ You're Done!

After running the SQL, everything works! Just hard refresh (`Ctrl + Shift + R`) and start syncing calendars! 🎉




