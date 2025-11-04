#!/usr/bin/env node

/**
 * Auto-Create Tables in Supabase
 * 
 * This script automatically creates all necessary tables in your Supabase database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Auto-Create Tables Script Starting...\n')
console.log('=' .repeat(60))

// SQL to create all tables
const createTablesSql = `
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  user_metadata JSONB DEFAULT '{}',
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  timezone VARCHAR DEFAULT 'UTC',
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
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER,
  summary TEXT,
  action_items JSONB DEFAULT '[]',
  attendees JSONB DEFAULT '[]',
  meeting_type VARCHAR DEFAULT 'regular',
  ai_insights JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table (alternative name)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);

-- DISABLE ROW LEVEL SECURITY for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- Insert demo user
INSERT INTO users (id, email, name, user_metadata) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'omar@example.com', 'Omar', '{"name": "Omar"}')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

async function executeSql(sql) {
  try {
    // Supabase doesn't support direct SQL execution via client
    // We need to use the REST API or PostgreSQL connection
    console.log('⚠️  Note: This script requires manual execution in Supabase SQL Editor')
    console.log('\nSQL has been prepared. Please follow these steps:\n')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy the SQL from scripts/complete-database-setup.sql')
    console.log('4. Or copy the SQL output below')
    console.log('\n' + '='.repeat(60))
    console.log('SQL TO EXECUTE:')
    console.log('='.repeat(60))
    console.log(sql)
    console.log('='.repeat(60))
    
    return { success: true, message: 'SQL prepared for manual execution' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function checkIfTablesExist() {
  console.log('\n📋 Checking existing tables...\n')
  
  const tables = ['users', 'projects', 'tasks', 'meetings', 'notifications', 'activities']
  const results = {}
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      
      if (error && error.code === '42P01') {
        results[table] = { exists: false }
        console.log(`❌ ${table.padEnd(20)} DOES NOT EXIST`)
      } else if (error) {
        results[table] = { exists: false, error: error.message }
        console.log(`⚠️  ${table.padEnd(20)} ERROR: ${error.message}`)
      } else {
        results[table] = { exists: true }
        console.log(`✅ ${table.padEnd(20)} EXISTS`)
      }
    } catch (error) {
      results[table] = { exists: false, error: error.message }
      console.log(`⚠️  ${table.padEnd(20)} ERROR: ${error.message}`)
    }
  }
  
  return results
}

async function main() {
  try {
    // Check existing tables
    const tableStatus = await checkIfTablesExist()
    
    const allExist = Object.values(tableStatus).every(t => t.exists)
    
    if (allExist) {
      console.log('\n' + '='.repeat(60))
      console.log('✅ ALL TABLES ALREADY EXIST!')
      console.log('='.repeat(60))
      console.log('\nYour database is already set up correctly.')
      console.log('No action needed!')
      return
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('⚠️  SOME TABLES ARE MISSING')
    console.log('='.repeat(60))
    
    // Save SQL to file
    const sqlPath = path.join(__dirname, 'auto-create-tables.sql')
    fs.writeFileSync(sqlPath, createTablesSql)
    console.log(`\n✅ SQL saved to: ${sqlPath}`)
    
    // Prepare SQL for execution
    await executeSql(createTablesSql)
    
    console.log('\n' + '='.repeat(60))
    console.log('📝 ALTERNATIVE: Use Supabase Dashboard')
    console.log('='.repeat(60))
    console.log('\n1. Open: https://supabase.com/dashboard')
    console.log('2. Select your project: xekyfsnxrnfkdvrcsiye')
    console.log('3. Go to: SQL Editor')
    console.log('4. Run the SQL from: scripts/auto-create-tables.sql')
    console.log('5. Or run: scripts/complete-database-setup.sql')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script complete!')
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })




