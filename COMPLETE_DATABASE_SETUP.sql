-- ============================================================================
-- AI ProjectHub - Complete Database Setup
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor
-- This will create all necessary tables, indexes, and sample data
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  avatar_url TEXT,
  user_metadata JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  timezone VARCHAR DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{
    "email_daily_summary": true,
    "smart_alerts": true,
    "morning_notifications": true,
    "push_notifications": true,
    "morning_notification_time": "08:00"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'archived')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget_allocated DECIMAL(12,2) DEFAULT 0,
  budget_spent DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  due_date DATE,
  team_members JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ai_priority_score DECIMAL(3,2) DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  due_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  tags JSONB DEFAULT '[]',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. RECORDING SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recording_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- in seconds
  transcription_status VARCHAR DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcription_text TEXT,
  transcription_confidence DECIMAL(3,2),
  ai_processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. MEETINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 30,
  status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  meeting_type VARCHAR DEFAULT 'regular' CHECK (meeting_type IN ('regular', 'standup', 'review', 'planning')),
  recording_session_id UUID REFERENCES recording_sessions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  participants JSONB DEFAULT '[]',
  attendees JSONB DEFAULT '[]',
  summary TEXT,
  action_items JSONB DEFAULT '[]',
  ai_insights JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. AI INSIGHTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('optimization', 'risk', 'prediction', 'productivity')),
  title VARCHAR NOT NULL,
  description TEXT,
  confidence DECIMAL(3,2),
  impact VARCHAR CHECK (impact IN ('low', 'medium', 'high')),
  category VARCHAR,
  actionable BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. NOTIFICATION TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_daily_summary BOOLEAN DEFAULT TRUE,
  smart_alerts BOOLEAN DEFAULT TRUE,
  morning_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  morning_notification_time TIME DEFAULT '08:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. CALENDAR SYNCS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  name VARCHAR NOT NULL,
  calendar_id VARCHAR NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  color VARCHAR DEFAULT '#3B82F6',
  enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 15,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. SYNCED EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES calendar_syncs(id) ON DELETE CASCADE,
  external_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  is_all_day BOOLEAN DEFAULT FALSE,
  status VARCHAR DEFAULT 'confirmed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sync_id, external_id)
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recording_sessions_user_id ON recording_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recording_sessions_project_id ON recording_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON ai_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_id ON calendar_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_sync_id ON synced_events(sync_id);
CREATE INDEX IF NOT EXISTS idx_synced_events_start_time ON synced_events(start_time);

-- ============================================================================
-- DISABLE ROW LEVEL SECURITY (For Demo/Development)
-- ============================================================================
-- Note: Enable RLS in production with proper policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE recording_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_syncs DISABLE ROW LEVEL SECURITY;
ALTER TABLE synced_events DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INSERT DEMO USER
-- ============================================================================
INSERT INTO users (id, email, name, user_metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 'Demo User', '{"name": "Demo User"}')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  user_metadata = EXCLUDED.user_metadata;

-- ============================================================================
-- INSERT SAMPLE PROJECTS
-- ============================================================================
INSERT INTO projects (id, name, description, owner_id, status, progress, due_date, team_members) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'AI ProjectHub Development', 'Building an intelligent project management platform with AI capabilities', '550e8400-e29b-41d4-a716-446655440000', 'active', 75, CURRENT_DATE + INTERVAL '7 days', '["user1", "user2", "user3"]'),
('550e8400-e29b-41d4-a716-446655440002', 'Dashboard Enhancement', 'Improving the dashboard with new analytics and insights', '550e8400-e29b-41d4-a716-446655440000', 'active', 45, CURRENT_DATE + INTERVAL '14 days', '["user1", "user2"]'),
('550e8400-e29b-41d4-a716-446655440003', 'Mobile App Integration', 'Integrating mobile app with the platform', '550e8400-e29b-41d4-a716-446655440000', 'active', 20, CURRENT_DATE + INTERVAL '21 days', '["user1", "user2", "user3", "user4"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  progress = EXCLUDED.progress;

-- ============================================================================
-- INSERT SAMPLE TASKS
-- ============================================================================
INSERT INTO tasks (id, title, description, project_id, assignee_id, status, priority, due_date) VALUES 
('550e8400-e29b-41d4-a716-446655440010', 'Design user interface', 'Create wireframes and mockups for the dashboard', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'in_progress', 'high', CURRENT_DATE + INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440011', 'Implement authentication', 'Set up user login and registration system', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'completed', 'high', CURRENT_DATE - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440012', 'Database optimization', 'Optimize database queries for better performance', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'todo', 'medium', CURRENT_DATE + INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440013', 'API documentation', 'Write comprehensive API documentation', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'todo', 'low', CURRENT_DATE + INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440014', 'Setup CI/CD pipeline', 'Configure automated testing and deployment', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'in_progress', 'urgent', CURRENT_DATE + INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority;

-- ============================================================================
-- INSERT SAMPLE ACTIVITIES
-- ============================================================================
INSERT INTO activities (user_id, action, entity_type, entity_id, entity_name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'created', 'project', '550e8400-e29b-41d4-a716-446655440001', 'AI ProjectHub Development'),
('550e8400-e29b-41d4-a716-446655440000', 'completed', 'task', '550e8400-e29b-41d4-a716-446655440011', 'Implement authentication'),
('550e8400-e29b-41d4-a716-446655440000', 'updated', 'project', '550e8400-e29b-41d4-a716-446655440001', 'AI ProjectHub Development'),
('550e8400-e29b-41d4-a716-446655440000', 'assigned', 'task', '550e8400-e29b-41d4-a716-446655440012', 'Database optimization')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT NOTIFICATION TEMPLATES
-- ============================================================================
INSERT INTO notification_templates (name, type, message) VALUES 
('Project Created', 'project', 'A new project has been created: {project_name}'),
('Task Assigned', 'task', 'You have been assigned a new task: {task_name}'),
('Deadline Reminder', 'deadline', 'Reminder: {task_name} is due soon'),
('Meeting Scheduled', 'meeting', 'A new meeting has been scheduled: {meeting_title}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INSERT NOTIFICATION PREFERENCES FOR DEMO USER
-- ============================================================================
INSERT INTO notification_preferences (user_id, email_daily_summary, smart_alerts, morning_notifications) VALUES 
('550e8400-e29b-41d4-a716-446655440000', TRUE, TRUE, TRUE)
ON CONFLICT (user_id) DO UPDATE SET
  email_daily_summary = EXCLUDED.email_daily_summary,
  smart_alerts = EXCLUDED.smart_alerts,
  morning_notifications = EXCLUDED.morning_notifications;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your database is now ready to use.
-- Demo user credentials:
--   Email: demo@example.com
--   ID: 550e8400-e29b-41d4-a716-446655440000
-- ============================================================================













