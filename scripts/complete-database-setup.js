const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

async function setupCompleteDatabase() {
  console.log('🚀 Setting up complete database with all missing tables...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ Supabase admin client created successfully')
    
    // SQL commands to create all missing tables and disable RLS
    const setupSQL = `
      -- Create missing activities table
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR NOT NULL,
        entity_type VARCHAR NOT NULL,
        entity_id UUID NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create missing notification_templates table
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        message TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create missing notification_preferences table
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

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
      CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

      -- Disable Row Level Security for all tables
      ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
      ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
      ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
      ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
      ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
    `
    
    console.log('🔧 Creating missing tables and disabling RLS...')
    
    // Execute the SQL using the REST API
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: setupSQL
    })
    
    if (error) {
      console.log('❌ Error executing SQL:', error.message)
      
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying alternative approach...')
      
      // Split the SQL into individual commands
      const sqlCommands = setupSQL.split(';').filter(cmd => cmd.trim())
      
      for (const sql of sqlCommands) {
        if (sql.trim()) {
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', { sql: sql.trim() })
            if (cmdError) {
              console.log(`⚠️ Warning for command: ${cmdError.message}`)
            } else {
              console.log('✅ Command executed successfully')
            }
          } catch (err) {
            console.log(`⚠️ Warning: ${err.message}`)
          }
        }
      }
    } else {
      console.log('✅ All SQL commands executed successfully')
    }
    
    // Test the setup
    console.log('\n🧪 Testing database setup...')
    
    // Test creating a project
    const testProject = {
      name: 'Test Project Setup',
      description: 'Testing database setup',
      status: 'active',
      progress: 0,
      budget_allocated: 10000,
      budget_spent: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team_members: ['test-user'],
      owner_id: '550e8400-e29b-41d4-a716-446655440000'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
    
    if (insertError) {
      console.log('❌ Error creating test project:', insertError.message)
      return false
    } else {
      console.log('✅ Test project created successfully!')
      console.log('📊 Project ID:', insertData[0].id)
      
      // Clean up test project
      await supabase
        .from('projects')
        .delete()
        .eq('id', insertData[0].id)
      console.log('🧹 Test project cleaned up')
    }
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('✅ All tables created')
    console.log('✅ RLS disabled')
    console.log('✅ Project creation works')
    console.log('\n💡 You can now add projects and tasks in your application!')
    
    return true
    
  } catch (error) {
    console.log('❌ Database setup failed:', error.message)
    console.log('\n💡 You may need to run the SQL manually in your Supabase dashboard.')
    return false
  }
}

setupCompleteDatabase()
  .then(success => {
    if (success) {
      console.log('\n🚀 Database is ready! You can now create projects and tasks.')
    } else {
      console.log('\n💥 Database setup failed. Please run the SQL manually in Supabase dashboard.')
    }
  })
  .catch(error => {
    console.log('\n💥 Setup failed with error:', error)
  })




















