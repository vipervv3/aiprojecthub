const { createClient } = require('@supabase/supabase-js')

// Supabase configuration with service role key for admin operations
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTables() {
  try {
    console.log('🔗 Connecting to Supabase with service role...')
    
    // Test connection
    const { data, error } = await supabase.from('auth.users').select('count').limit(1)
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error)
      return
    }
    
    console.log('✅ Connected to Supabase successfully!')
    
    // Create essential tables
    const tables = [
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
            status VARCHAR DEFAULT 'active',
            progress INTEGER DEFAULT 0,
            due_date TIMESTAMP WITH TIME ZONE,
            owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            team_members UUID[] DEFAULT '{}',
            tags TEXT[] DEFAULT '{}',
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
            status VARCHAR DEFAULT 'todo',
            priority VARCHAR DEFAULT 'medium',
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            due_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ]
    
    console.log('📝 Creating database tables...')
    
    for (const table of tables) {
      console.log(`⚡ Creating table: ${table.name}`)
      
      try {
        const { error } = await supabase.rpc('exec', { sql: table.sql })
        if (error) {
          console.warn(`⚠️  Warning for ${table.name}:`, error.message)
        } else {
          console.log(`✅ Table ${table.name} created successfully`)
        }
      } catch (err) {
        console.warn(`⚠️  Warning for ${table.name}:`, err.message)
      }
    }
    
    console.log('🎉 Database setup completed!')
    console.log('📋 Next steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Authentication > Users')
    console.log('3. Try registering a new user in your app')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
  }
}

// Run the setup
setupTables()




















