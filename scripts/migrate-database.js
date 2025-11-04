const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateDatabase() {
  try {
    console.log('🔗 Connecting to Supabase...')
    
    // Test connection
    const { data: users, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('❌ Failed to connect to Supabase:', authError.message)
      return
    }
    
    console.log('✅ Connected to Supabase successfully!')
    console.log(`📊 Found ${users.length} existing users`)
    
    // Check existing tables
    console.log('\n📋 Checking existing tables...')
    
    const tablesToCheck = ['users', 'projects', 'tasks', 'meetings', 'activity_log', 'notifications']
    const existingTables = []
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (!error) {
          existingTables.push(table)
          console.log(`✅ Table '${table}' exists`)
        }
      } catch (err) {
        console.log(`❌ Table '${table}' does not exist`)
      }
    }
    
    console.log(`\n📊 Found ${existingTables.length} existing tables: ${existingTables.join(', ')}`)
    
    // Create missing tables
    const missingTables = tablesToCheck.filter(table => !existingTables.includes(table))
    
    if (missingTables.length > 0) {
      console.log(`\n🔧 Creating ${missingTables.length} missing tables...`)
      
      const tableDefinitions = {
        users: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
        `,
        projects: `
          CREATE TABLE IF NOT EXISTS public.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            description TEXT,
            status VARCHAR DEFAULT 'active',
            progress INTEGER DEFAULT 0,
            due_date TIMESTAMP WITH TIME ZONE,
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            team_members UUID[] DEFAULT '{}',
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
        tasks: `
          CREATE TABLE IF NOT EXISTS public.tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR NOT NULL,
            description TEXT,
            status VARCHAR DEFAULT 'todo',
            priority VARCHAR DEFAULT 'medium',
            project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
            assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            due_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
        meetings: `
          CREATE TABLE IF NOT EXISTS public.meetings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            location VARCHAR,
            meeting_url TEXT,
            organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            attendees UUID[] DEFAULT '{}',
            status VARCHAR DEFAULT 'scheduled',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
        activity_log: `
          CREATE TABLE IF NOT EXISTS public.activity_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            action VARCHAR NOT NULL,
            entity_type VARCHAR NOT NULL,
            entity_id UUID,
            details JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
        notifications: `
          CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title VARCHAR NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR DEFAULT 'info',
            read BOOLEAN DEFAULT FALSE,
            data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
      
      for (const table of missingTables) {
        console.log(`⚡ Creating table: ${table}`)
        
        try {
          // Use direct SQL execution via Supabase dashboard
          console.log(`📝 Please run this SQL in your Supabase dashboard SQL editor:`)
          console.log(`\n${tableDefinitions[table]}\n`)
        } catch (err) {
          console.warn(`⚠️  Warning for ${table}:`, err.message)
        }
      }
    } else {
      console.log('✅ All required tables already exist!')
    }
    
    // Check and create indexes
    console.log('\n🔍 Checking indexes...')
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);',
      'CREATE INDEX IF NOT EXISTS idx_meetings_organizer_id ON public.meetings(organizer_id);',
      'CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);'
    ]
    
    console.log('📝 Please run these index creation statements in your Supabase dashboard:')
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index}`)
    })
    
    // Check RLS policies
    console.log('\n🔒 Checking Row Level Security policies...')
    console.log('📝 Please ensure RLS is enabled and policies are set up in your Supabase dashboard')
    
    console.log('\n🎉 Database migration check completed!')
    console.log('📋 Next steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run the SQL statements shown above')
    console.log('4. Test user registration in your app')
    
  } catch (error) {
    console.error('❌ Error during migration:', error)
  }
}

// Run the migration
migrateDatabase()




















