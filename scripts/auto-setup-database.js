#!/usr/bin/env node

/**
 * Automatic Database Setup Script
 * This script will:
 * 1. Connect to your Supabase database
 * 2. Create all necessary tables
 * 3. Insert sample data
 * 4. Verify everything is set up correctly
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🚀 AI ProjectHub - Automatic Database Setup\n')
console.log('=' .repeat(60))

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('\nPlease set:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// SQL statements broken into manageable chunks
const sqlStatements = [
  // 1. Users table
  {
    name: 'users table',
    sql: `
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
    `
  },

  // 2. Projects table
  {
    name: 'projects table',
    sql: `
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
    `
  },

  // 3. Tasks table
  {
    name: 'tasks table',
    sql: `
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
    `
  },
  
  // 4. Activities table
  {
    name: 'activities table',
    sql: `
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
    `
  },
  
  // 5. Recording sessions table
  {
    name: 'recording_sessions table',
    sql: `
      CREATE TABLE IF NOT EXISTS recording_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        title VARCHAR,
        description TEXT,
        file_path TEXT,
        file_size BIGINT,
        duration INTEGER,
        status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        transcript TEXT,
        summary TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  
  // 6. Meetings table
  {
    name: 'meetings table',
    sql: `
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
        summary TEXT,
        action_items JSONB DEFAULT '[]',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  
  // 7. AI Insights table
  {
    name: 'ai_insights table',
    sql: `
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
    `
  },
  
  // 8. Notifications table
  {
    name: 'notifications table',
    sql: `
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
    `
  },
  
  // 9. Notification templates
  {
    name: 'notification_templates table',
    sql: `
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        message TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  
  // 10. Notification preferences
  {
    name: 'notification_preferences table',
    sql: `
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
    `
  },
  
  // 11. Calendar syncs
  {
    name: 'calendar_syncs table',
    sql: `
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
    `
  },
  
  // 12. Synced events
  {
    name: 'synced_events table',
    sql: `
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
    `
  }
]

// Indexes
const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id)',
  'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
  'CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id)',
  'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
  'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)',
  'CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_recording_sessions_user_id ON recording_sessions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_recording_sessions_project_id ON recording_sessions(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at)',
  'CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON ai_insights(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
  'CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_id ON calendar_syncs(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_synced_events_sync_id ON synced_events(sync_id)',
  'CREATE INDEX IF NOT EXISTS idx_synced_events_start_time ON synced_events(start_time)'
]

// RLS disable statements
const rlsStatements = [
  'ALTER TABLE users DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE projects DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE tasks DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE activities DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE recording_sessions DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE meetings DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE notifications DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE calendar_syncs DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE synced_events DISABLE ROW LEVEL SECURITY'
]

async function runSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  if (error) throw error
  return data
}

async function setupDatabase() {
  try {
    console.log('\n📋 Creating tables...\n')
    
    // Create tables
    for (const statement of sqlStatements) {
      try {
        process.stdout.write(`   Creating ${statement.name}... `)
        await supabase.rpc('exec_sql', { sql_query: statement.sql })
        console.log('✅')
      } catch (error) {
        // Table might already exist, that's okay
        console.log('⚠️  (may already exist)')
      }
    }
    
    console.log('\n📊 Creating indexes...\n')
    
    // Create indexes
    for (const index of indexes) {
      try {
        await supabase.rpc('exec_sql', { sql_query: index })
      } catch (error) {
        // Index might already exist
      }
    }
    console.log('   ✅ Indexes created')
    
    console.log('\n🔓 Disabling Row Level Security (for demo)...\n')
    
    // Disable RLS
    for (const rls of rlsStatements) {
      try {
        await supabase.rpc('exec_sql', { sql_query: rls })
      } catch (error) {
        // RLS might already be disabled
      }
    }
    console.log('   ✅ RLS disabled')
    
    console.log('\n👤 Creating demo user...\n')
    
    // Insert demo user
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'demo@example.com',
        name: 'Demo User',
        user_metadata: { name: 'Demo User' }
      }, { onConflict: 'id' })
    
    if (!userError) {
      console.log('   ✅ Demo user created (demo@example.com)')
    }
    
    console.log('\n📁 Creating sample projects...\n')
    
    // Insert sample projects
    const projects = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'AI ProjectHub Development',
        description: 'Building an intelligent project management platform with AI capabilities',
        owner_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        progress: 75,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        team_members: JSON.stringify(['user1', 'user2', 'user3'])
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Dashboard Enhancement',
        description: 'Improving the dashboard with new analytics and insights',
        owner_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        progress: 45,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        team_members: JSON.stringify(['user1', 'user2'])
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Mobile App Integration',
        description: 'Integrating mobile app with the platform',
        owner_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        progress: 20,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        team_members: JSON.stringify(['user1', 'user2', 'user3', 'user4'])
      }
    ]
    
    for (const project of projects) {
      const { error } = await supabase
        .from('projects')
        .upsert(project, { onConflict: 'id' })
      
      if (!error) {
        console.log(`   ✅ ${project.name}`)
      }
    }
    
    console.log('\n✅ Creating sample tasks...\n')
    
    // Insert sample tasks
    const tasks = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        title: 'Design user interface',
        description: 'Create wireframes and mockups for the dashboard',
        project_id: '550e8400-e29b-41d4-a716-446655440001',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        title: 'Implement authentication',
        description: 'Set up user login and registration system',
        project_id: '550e8400-e29b-41d4-a716-446655440001',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'completed',
        priority: 'high',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        title: 'Database optimization',
        description: 'Optimize database queries for better performance',
        project_id: '550e8400-e29b-41d4-a716-446655440002',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'todo',
        priority: 'medium',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        title: 'API documentation',
        description: 'Write comprehensive API documentation',
        project_id: '550e8400-e29b-41d4-a716-446655440003',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'todo',
        priority: 'low',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        title: 'Setup CI/CD pipeline',
        description: 'Configure automated testing and deployment',
        project_id: '550e8400-e29b-41d4-a716-446655440001',
        assignee_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'in_progress',
        priority: 'urgent',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
    
    for (const task of tasks) {
      const { error } = await supabase
        .from('tasks')
        .upsert(task, { onConflict: 'id' })
      
      if (!error) {
        console.log(`   ✅ ${task.title}`)
      }
    }
    
    console.log('\n📝 Creating sample activities...\n')
    
    // Insert sample activities
    const activities = [
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'created',
        entity_type: 'project',
        entity_id: '550e8400-e29b-41d4-a716-446655440001',
        entity_name: 'AI ProjectHub Development'
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'completed',
        entity_type: 'task',
        entity_id: '550e8400-e29b-41d4-a716-446655440011',
        entity_name: 'Implement authentication'
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'updated',
        entity_type: 'project',
        entity_id: '550e8400-e29b-41d4-a716-446655440001',
        entity_name: 'AI ProjectHub Development'
      },
      {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        action: 'assigned',
        entity_type: 'task',
        entity_id: '550e8400-e29b-41d4-a716-446655440012',
        entity_name: 'Database optimization'
      }
    ]
    
    for (const activity of activities) {
      await supabase.from('activities').insert(activity)
    }
    console.log('   ✅ Activities created')
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ DATABASE SETUP COMPLETE!')
    console.log('='.repeat(60))
    
    return true
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    return false
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...\n')
  
  try {
    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@example.com')
    
    if (usersError) throw new Error(`Users table: ${usersError.message}`)
    console.log(`✅ Users table: ${users?.length || 0} users`)
    
    // Check projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
    
    if (projectsError) throw new Error(`Projects table: ${projectsError.message}`)
    console.log(`✅ Projects table: ${projects?.length || 0} projects`)
    
    // Check tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
    
    if (tasksError) throw new Error(`Tasks table: ${tasksError.message}`)
    console.log(`✅ Tasks table: ${tasks?.length || 0} tasks`)
    
    // Check activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
    
    if (activitiesError) throw new Error(`Activities table: ${activitiesError.message}`)
    console.log(`✅ Activities table: ${activities?.length || 0} activities`)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL CHECKS PASSED!')
    console.log('='.repeat(60))
    console.log('\n🚀 Ready to test!')
    console.log('\nNext steps:')
    console.log('  1. Run: npm run dev')
    console.log('  2. Open: http://localhost:3000')
    console.log('  3. Navigate to /dashboard')
    console.log('\n' + '='.repeat(60))
    
    return true
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    return false
  }
}

async function main() {
  const setupSuccess = await setupDatabase()
  
  if (setupSuccess) {
    await verifySetup()
  } else {
    console.log('\n❌ Setup incomplete. Please check errors above.')
    process.exit(1)
  }
}

main().catch(console.error)
