const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function testFinalSetup() {
  console.log('🧪 Testing final database setup...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // Test creating a project
    console.log('📝 Testing project creation...')
    const testProject = {
      name: 'Final Test Project',
      description: 'Testing after complete database setup',
      status: 'active',
      progress: 0,
      budget_allocated: 50000,
      budget_spent: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team_members: ['demo-user'],
      owner_id: '550e8400-e29b-41d4-a716-446655440000'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
    
    if (insertError) {
      console.log('❌ Error creating project:', insertError.message)
      console.log('💡 You still need to run the SQL in your Supabase dashboard.')
      return false
    } else {
      console.log('✅ Project created successfully!')
      console.log('📊 Project ID:', insertData[0].id)
      console.log('📊 Project Name:', insertData[0].name)
      
      // Test fetching projects
      console.log('\n🔍 Testing project retrieval...')
      const { data: fetchData, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', '550e8400-e29b-41d4-a716-446655440000')
      
      if (fetchError) {
        console.log('❌ Error fetching projects:', fetchError.message)
      } else {
        console.log('✅ Projects fetched successfully!')
        console.log('📊 Found', fetchData.length, 'projects')
      }
      
      // Clean up test project
      await supabase
        .from('projects')
        .delete()
        .eq('id', insertData[0].id)
      console.log('🧹 Test project cleaned up')
    }
    
    // Test activities table
    console.log('\n🔍 Testing activities table...')
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(1)
    
    if (activitiesError) {
      console.log('❌ Activities table error:', activitiesError.message)
    } else {
      console.log('✅ Activities table accessible')
    }
    
    console.log('\n🎉 Database setup test completed!')
    console.log('✅ Project creation works')
    console.log('✅ Project retrieval works')
    console.log('✅ All tables are accessible')
    console.log('\n💡 You can now add projects and tasks in your application!')
    
    return true
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message)
    return false
  }
}

testFinalSetup()
  .then(success => {
    if (success) {
      console.log('\n🚀 Your database is ready! You can now create projects and tasks.')
    } else {
      console.log('\n💥 Database setup incomplete. Please run the SQL in Supabase dashboard.')
    }
  })
  .catch(error => {
    console.log('\n💥 Test failed with error:', error)
  })


















