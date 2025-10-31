const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function testDatabaseConnection() {
  console.log('Testing Supabase database connection...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // Test if we can connect to the database
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Error accessing projects table:', error.message)
      
      // Check if the table exists
      if (error.message.includes('relation "projects" does not exist')) {
        console.log('🔧 Projects table does not exist. Need to create it.')
        return false
      }
    } else {
      console.log('✅ Projects table accessible')
      console.log('📊 Found', data?.length || 0, 'projects')
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
    console.log('❌ Database connection failed:', error.message)
    return false
  }
}

testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database connection test passed!')
    } else {
      console.log('\n💥 Database connection test failed!')
    }
  })
  .catch(error => {
    console.log('\n💥 Test failed with error:', error)
  })
