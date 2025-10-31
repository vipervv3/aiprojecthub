const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

async function setupDatabasePolicies() {
  console.log('Setting up database policies...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ Supabase admin client created successfully')
    
    // Disable RLS for now to allow data operations
    console.log('\n🔧 Disabling RLS for projects table...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE projects DISABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsError) {
      console.log('❌ Error disabling RLS:', rlsError.message)
    } else {
      console.log('✅ RLS disabled for projects table')
    }
    
    // Disable RLS for tasks table
    console.log('\n🔧 Disabling RLS for tasks table...')
    const { error: tasksRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;'
    })
    
    if (tasksRlsError) {
      console.log('❌ Error disabling RLS for tasks:', tasksRlsError.message)
    } else {
      console.log('✅ RLS disabled for tasks table')
    }
    
    // Disable RLS for activities table
    console.log('\n🔧 Disabling RLS for activities table...')
    const { error: activitiesRlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE activities DISABLE ROW LEVEL SECURITY;'
    })
    
    if (activitiesRlsError) {
      console.log('❌ Error disabling RLS for activities:', activitiesRlsError.message)
    } else {
      console.log('✅ RLS disabled for activities table')
    }
    
    // Test creating a project
    console.log('\n🧪 Testing project creation...')
    const testProject = {
      name: 'Test Project',
      description: 'This is a test project',
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
      console.log('✅ Test project created successfully:', insertData[0])
      
      // Clean up test project
      await supabase
        .from('projects')
        .delete()
        .eq('id', insertData[0].id)
      console.log('🧹 Test project cleaned up')
    }
    
    return true
    
  } catch (error) {
    console.log('❌ Database setup failed:', error.message)
    return false
  }
}

setupDatabasePolicies()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database policies setup completed!')
    } else {
      console.log('\n💥 Database policies setup failed!')
    }
  })
  .catch(error => {
    console.log('\n💥 Setup failed with error:', error)
  })


















