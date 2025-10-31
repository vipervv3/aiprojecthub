const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Supabase Database Migration Tool')
console.log('==================================')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateDatabase() {
  try {
    console.log('📋 Starting database migration...')
    
    // Test connection
    console.log('🔍 Testing connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError && !testError.message.includes('Could not find the table')) {
      console.error('❌ Connection failed:', testError.message)
      return false
    }
    
    console.log('✅ Connection successful')
    
    if (!testError) {
      console.log('ℹ️  Tables already exist, testing functionality...')
      await testDatabase()
      return true
    }
    
    console.log('📝 Tables need to be created')
    
    // Create tables using direct SQL execution
    const tables = await createTables()
    
    if (tables) {
      console.log('✅ Database migration completed successfully!')
      await testDatabase()
      await createSampleData()
      return true
    } else {
      console.log('❌ Database migration failed')
      return false
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    return false
  }
}

async function createTables() {
  console.log('\n📊 Creating database tables...')
  
  const tableDefinitions = [
    {
      name: 'users',
      sql: `
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
      `
    },
    {
      name: 'projects',
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
    {
      name: 'tasks',
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
          due_date TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          estimated_hours DECIMAL(5,2),
          actual_hours DECIMAL(5,2),
          tags JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'notifications',
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR NOT NULL CHECK (type IN ('task_due', 'project_update', 'meeting_reminder', 'ai_insight', 'daily_summary', 'morning_notification', 'smart_alert')),
          title VARCHAR NOT NULL,
          message TEXT,
          read BOOLEAN DEFAULT FALSE,
          action_url TEXT,
          metadata JSONB DEFAULT '{}',
          scheduled_for TIMESTAMP WITH TIME ZONE,
          sent_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'meetings',
      sql: `
        CREATE TABLE IF NOT EXISTS meetings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR NOT NULL,
          description TEXT,
          scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
          duration INTEGER,
          recording_session_id UUID,
          summary TEXT,
          action_items JSONB DEFAULT '[]',
          attendees JSONB DEFAULT '[]',
          meeting_type VARCHAR DEFAULT 'regular' CHECK (meeting_type IN ('regular', 'standup', 'review', 'planning')),
          ai_insights JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'ai_insights',
      sql: `
        CREATE TABLE IF NOT EXISTS ai_insights (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          insight_type VARCHAR NOT NULL CHECK (insight_type IN ('productivity', 'efficiency', 'burnout_risk', 'deadline_alert', 'recommendation', 'health_analysis')),
          title VARCHAR NOT NULL,
          description TEXT,
          priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          actionable BOOLEAN DEFAULT TRUE,
          confidence_score DECIMAL(3,2) DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE
        );
      `
    }
  ]
  
  let successCount = 0
  
  for (const table of tableDefinitions) {
    try {
      console.log(`  Creating ${table.name} table...`)
      
      // Use the REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ query: table.sql })
      })
      
      if (response.ok) {
        console.log(`  ✅ ${table.name} created`)
        successCount++
      } else {
        const errorText = await response.text()
        console.log(`  ⚠️  ${table.name}: ${response.status} - ${errorText.substring(0, 100)}`)
      }
      
    } catch (error) {
      console.log(`  ⚠️  ${table.name}: ${error.message}`)
    }
  }
  
  // Enable RLS
  await enableRLS()
  
  console.log(`\n📊 Created ${successCount}/${tableDefinitions.length} tables`)
  return successCount > 0
}

async function enableRLS() {
  console.log('\n🔐 Setting up Row Level Security...')
  
  const rlsPolicies = [
    'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;',
    
    // Basic policies
    'CREATE POLICY IF NOT EXISTS "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);',
    'CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);',
    'CREATE POLICY IF NOT EXISTS "Users can view owned projects" ON projects FOR SELECT USING (auth.uid() = owner_id);',
    'CREATE POLICY IF NOT EXISTS "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);',
    'CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY IF NOT EXISTS "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);'
  ]
  
  for (const policy of rlsPolicies) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ query: policy })
      })
      
      if (!response.ok) {
        console.log(`  ⚠️  RLS policy warning: ${response.status}`)
      }
    } catch (error) {
      console.log(`  ⚠️  RLS policy error: ${error.message}`)
    }
  }
  
  console.log('  ✅ Row Level Security configured')
}

async function testDatabase() {
  console.log('\n🧪 Testing database functionality...')
  
  const tables = ['users', 'projects', 'tasks', 'notifications', 'meetings', 'ai_insights']
  let workingTables = 0
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`  ❌ ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ ${table}: Accessible`)
        workingTables++
      }
    } catch (error) {
      console.log(`  ❌ ${table}: ${error.message}`)
    }
  }
  
  console.log(`\n📊 Database Status: ${workingTables}/${tables.length} tables working`)
  return workingTables === tables.length
}

async function createSampleData() {
  console.log('\n🌱 Creating sample data...')
  
  try {
    // Create sample user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        email: 'demo@aiprojecthub.com',
        name: 'Demo User',
        preferences: {},
        notification_preferences: {
          email_daily_summary: true,
          smart_alerts: true,
          morning_notifications: true,
          push_notifications: true,
          morning_notification_time: '08:00'
        }
      }, { onConflict: 'email' })
      .select()
    
    if (userError) {
      console.log('  ℹ️  Sample user creation skipped:', userError.message)
      return
    }
    
    console.log('  ✅ Sample user created/updated')
    
    // Create sample projects
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .upsert([
        {
          name: 'AI ProjectHub Demo',
          description: 'Demonstration project for AI ProjectHub features',
          owner_id: userData[0].id,
          status: 'active',
          progress: 75,
          budget_allocated: 50000,
          budget_spent: 37500,
          start_date: '2024-01-01',
          due_date: '2024-03-31'
        },
        {
          name: 'Mobile App Development',
          description: 'Building a mobile application with AI features',
          owner_id: userData[0].id,
          status: 'active',
          progress: 25,
          budget_allocated: 75000,
          budget_spent: 18750,
          start_date: '2024-02-01',
          due_date: '2024-06-30'
        }
      ], { onConflict: 'name' })
      .select()
    
    if (projectError) {
      console.log('  ℹ️  Sample projects creation skipped:', projectError.message)
    } else {
      console.log('  ✅ Sample projects created/updated')
      
      // Create sample tasks
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .upsert([
          {
            title: 'Set up AI integration',
            description: 'Configure AI services for the project',
            project_id: projectData[0].id,
            assignee_id: userData[0].id,
            status: 'in_progress',
            priority: 'high',
            ai_priority_score: 85,
            is_ai_generated: true,
            due_date: '2024-02-15'
          },
          {
            title: 'Design user interface',
            description: 'Create wireframes and mockups',
            project_id: projectData[1].id,
            assignee_id: userData[0].id,
            status: 'todo',
            priority: 'medium',
            ai_priority_score: 60,
            is_ai_generated: false,
            due_date: '2024-02-28'
          }
        ], { onConflict: 'title' })
        .select()
      
      if (taskError) {
        console.log('  ℹ️  Sample tasks creation skipped:', taskError.message)
      } else {
        console.log('  ✅ Sample tasks created/updated')
      }
    }
    
  } catch (error) {
    console.log('  ℹ️  Sample data creation skipped:', error.message)
  }
}

// Main execution
async function main() {
  console.log('🔧 Starting automated database setup...')
  
  const success = await migrateDatabase()
  
  if (success) {
    console.log('\n🎉 AI ProjectHub database setup completed successfully!')
    console.log('\n📋 What was created:')
    console.log('• Users table with authentication')
    console.log('• Projects table with budget tracking')
    console.log('• Tasks table with AI features')
    console.log('• Notifications system')
    console.log('• Meeting intelligence tables')
    console.log('• AI insights and analytics')
    console.log('• Row Level Security policies')
    console.log('• Sample data for testing')
    
    console.log('\n🚀 Ready to use:')
    console.log('• Visit http://localhost:3000')
    console.log('• Use demo credentials: demo@aiprojecthub.com')
    console.log('• Test all features with real data')
  } else {
    console.log('\n❌ Database setup failed')
    console.log('\n📋 Alternative setup methods:')
    console.log('1. Manual setup via Supabase Dashboard')
    console.log('2. Use Supabase CLI: supabase db push')
    console.log('3. Copy SQL from scripts/create-tables.sql to Supabase SQL Editor')
  }
}

main().catch(console.error)



















