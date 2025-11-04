-- ================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ================================================
-- Run this in your Supabase SQL Editor!
-- Go to: https://supabase.com/dashboard → SQL Editor → New Query

-- Step 1: Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view owned projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update owned projects" ON projects;
DROP POLICY IF EXISTS "Users can delete owned projects" ON projects;
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own recordings" ON recording_sessions;
DROP POLICY IF EXISTS "Users can create recordings" ON recording_sessions;
DROP POLICY IF EXISTS "Users can update own recordings" ON recording_sessions;
DROP POLICY IF EXISTS "Users can delete own recordings" ON recording_sessions;
DROP POLICY IF EXISTS "Users can view own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can create meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON meetings;
DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can create insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own activity" ON activity_log;
DROP POLICY IF EXISTS "System can create activity" ON activity_log;

-- Step 3: Create RLS Policies

-- ================================================
-- USERS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ================================================
-- PROJECTS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view owned projects" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update owned projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete owned projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- ================================================
-- TASKS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view project tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update project tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project tasks" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- ================================================
-- RECORDING SESSIONS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view own recordings" ON recording_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create recordings" ON recording_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON recording_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings" ON recording_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- MEETINGS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view own meetings" ON meetings
  FOR SELECT USING (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meetings" ON meetings
  FOR INSERT WITH CHECK (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meetings" ON meetings
  FOR UPDATE USING (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meetings" ON meetings
  FOR DELETE USING (
    recording_session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM recording_sessions 
      WHERE recording_sessions.id = meetings.recording_session_id 
      AND recording_sessions.user_id = auth.uid()
    )
  );

-- ================================================
-- AI INSIGHTS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view own insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create insights" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================
-- NOTIFICATIONS TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow system to create notifications (for automated notifications)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- ================================================
-- ACTIVITY LOG TABLE POLICIES
-- ================================================
CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Allow system to create activity logs
CREATE POLICY "System can create activity" ON activity_log
  FOR INSERT WITH CHECK (true);

-- ================================================
-- DONE! Your database is now secure!
-- ================================================

