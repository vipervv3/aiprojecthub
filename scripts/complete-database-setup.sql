-- Complete Database Setup for AI ProjectHub
-- Run this in your Supabase SQL Editor

-- 1. Create missing activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create missing notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create missing notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_daily_summary BOOLEAN DEFAULT true,
  smart_alerts BOOLEAN DEFAULT true,
  morning_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  morning_notification_time TIME DEFAULT '08:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- 5. DISABLE ROW LEVEL SECURITY for all tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- 6. Insert sample data for testing
INSERT INTO users (id, email, user_metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', '{"name": "Demo User"}')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert sample notification templates
INSERT INTO notification_templates (name, type, message) VALUES 
('Project Created', 'project', 'A new project has been created: {project_name}'),
('Task Assigned', 'task', 'You have been assigned a new task: {task_name}'),
('Deadline Reminder', 'deadline', 'Reminder: {task_name} is due soon')
ON CONFLICT DO NOTHING;

-- 8. Insert sample notification preferences for demo user
INSERT INTO notification_preferences (user_id, email_daily_summary, smart_alerts, morning_notifications) VALUES 
('550e8400-e29b-41d4-a716-446655440000', true, true, true)
ON CONFLICT (user_id) DO NOTHING;




















