const { createClient } = require('@supabase/supabase-js')

// Supabase configuration with service key for admin access
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

async function disableRLS() {
  console.log('🔧 Disabling Row Level Security (RLS) for all tables...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ Supabase admin client created successfully')
    
    // List of tables to disable RLS for
    const tables = [
      'projects',
      'tasks', 
      'activities',
      'users',
      'meetings',
      'notifications',
      'notification_templates',
      'notification_preferences'
    ]
    
    console.log('📋 Disabling RLS for tables:', tables.join(', '))
    
    // Try to disable RLS by attempting to insert and delete a test record
    // This will trigger RLS and we can see if it's working
    for (const table of tables) {
      try {
        // Test if we can access the table
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`⚠️ Table '${table}': ${error.message}`)
        } else {
          console.log(`✅ Table '${table}' accessible`)
        }
      } catch (err) {
        console.log(`⚠️ Table '${table}': ${err.message}`)
      }
    }
    
    // Test project creation with service key
    console.log('\n🧪 Testing project creation with service key...')
    const testProject = {
      name: 'RLS Test Project',
      description: 'Testing RLS with service key',
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
      console.log('💡 RLS is still enabled. You need to disable it manually in Supabase dashboard.')
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
    
    console.log('\n📋 Manual Steps Required:')
    console.log('========================')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project: xekyfsnxrnfkdvrcsiye')
    console.log('3. Click "SQL Editor" in the left sidebar')
    console.log('4. Click "New Query"')
    console.log('5. Copy and paste this SQL:')
    console.log('')
    console.log('ALTER TABLE projects DISABLE ROW LEVEL SECURITY;')
    console.log('ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;')
    console.log('ALTER TABLE activities DISABLE ROW LEVEL SECURITY;')
    console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;')
    console.log('ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;')
    console.log('ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;')
    console.log('ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;')
    console.log('ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('6. Click "Run" button')
    console.log('7. You should see "Success. No rows returned" for each table')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

disableRLS()




















