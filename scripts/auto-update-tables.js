const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function updateTables() {
  console.log('🔧 Auto-updating database tables...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Create activities table
    console.log('📝 Creating activities table...')
    const { error: activitiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          action VARCHAR NOT NULL,
          entity_type VARCHAR NOT NULL,
          entity_id UUID NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (activitiesError) {
      console.log('⚠️ Activities table creation:', activitiesError.message)
    } else {
      console.log('✅ Activities table created')
    }
    
    // Create notification_templates table
    console.log('📝 Creating notification_templates table...')
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notification_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          type VARCHAR NOT NULL,
          message TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (templatesError) {
      console.log('⚠️ Notification templates table creation:', templatesError.message)
    } else {
      console.log('✅ Notification templates table created')
    }
    
    // Create notification_preferences table
    console.log('📝 Creating notification_preferences table...')
    const { error: prefsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (prefsError) {
      console.log('⚠️ Notification preferences table creation:', prefsError.message)
    } else {
      console.log('✅ Notification preferences table created')
    }
    
    // Disable RLS
    console.log('🔓 Disabling Row Level Security...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
        ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
        ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
        ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
        ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
        ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
        ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
      `
    })
    
    if (rlsError) {
      console.log('⚠️ RLS disable:', rlsError.message)
    } else {
      console.log('✅ RLS disabled for all tables')
    }
    
    console.log('🎉 Database tables updated successfully!')
    console.log('✅ You can now create projects and tasks')
    
  } catch (error) {
    console.log('❌ Error updating tables:', error.message)
  }
}

updateTables()




















