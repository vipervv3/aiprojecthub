#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AI ProjectHub...\n');

// Create .env.local file
const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xekyfsnxrnfkdvrcsiye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w

# AI Services (Optional - for future features)
OPENAI_API_KEY=your_openai_key_here
GROQ_API_KEY=your_groq_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_key_here

# Email Service (Optional - for future features)
RESEND_API_KEY=your_resend_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000`;

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local file with Supabase credentials');
} catch (error) {
  console.log('❌ Could not create .env.local file:', error.message);
  console.log('📝 Please create .env.local manually with the following content:');
  console.log(envContent);
}

// Create database setup SQL
const dbSetupSQL = `-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  avatar_url TEXT,
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

-- Projects table
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

-- Tasks table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Insert sample data
INSERT INTO users (id, email, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'omar@example.com', 'Omar') 
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (id, name, description, owner_id, status, progress, due_date, team_members) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'AI ProjectHub Development', 'Building an intelligent project management platform', '550e8400-e29b-41d4-a716-446655440000', 'active', 75, NOW() + INTERVAL '7 days', '["user1", "user2", "user3"]'),
('550e8400-e29b-41d4-a716-446655440002', 'Dashboard Enhancement', 'Improving the dashboard with new features', '550e8400-e29b-41d4-a716-446655440000', 'active', 45, NOW() + INTERVAL '14 days', '["user1", "user2"]'),
('550e8400-e29b-41d4-a716-446655440003', 'Mobile App Integration', 'Integrating mobile app with the platform', '550e8400-e29b-41d4-a716-446655440000', 'active', 20, NOW() + INTERVAL '21 days', '["user1", "user2", "user3", "user4"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, description, project_id, assignee_id, status, priority, due_date) VALUES 
('550e8400-e29b-41d4-a716-446655440010', 'Design user interface', 'Create wireframes and mockups for the dashboard', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'in_progress', 'high', NOW() + INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440011', 'Implement authentication', 'Set up user login and registration system', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'completed', 'high', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440012', 'Database optimization', 'Optimize database queries for better performance', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'todo', 'medium', NOW() + INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440013', 'API documentation', 'Write comprehensive API documentation', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'todo', 'low', NOW() + INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_log (user_id, action, entity_type, entity_id) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'created', 'project', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440000', 'completed', 'task', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440000', 'updated', 'project', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440000', 'assigned', 'task', '550e8400-e29b-41d4-a716-446655440012')
ON CONFLICT DO NOTHING;`;

try {
  fs.writeFileSync('database-setup.sql', dbSetupSQL);
  console.log('✅ Created database-setup.sql file');
} catch (error) {
  console.log('❌ Could not create database-setup.sql file:', error.message);
}

console.log('\n🎯 Next Steps:');
console.log('1. Copy the content above to create .env.local file');
console.log('2. Use PostgreSQL Tools extension to run database-setup.sql');
console.log('3. Restart your development server: npm run dev');
console.log('\n📋 PostgreSQL Tools Connection Details:');
console.log('Host: db.xekyfsnxrnfkdvrcsiye.supabase.co');
console.log('Port: 5432');
console.log('Database: postgres');
console.log('Username: postgres');
console.log('Password: Get from Supabase Dashboard → Settings → Database');
console.log('\n🚀 Your AI ProjectHub will be ready to go!');




















