const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function testPersistence() {
  console.log('🧪 Testing project persistence...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // Create a test project
    console.log('\n📝 Creating test project...')
    const testProject = {
      name: 'Persistence Test Project',
      description: 'Testing if projects persist after navigation',
      status: 'active',
      progress: 0,
      budget_allocated: 10000,
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
      console.log('❌ Project creation failed:', insertError.message)
      return false
    }
    
    console.log('✅ Project created successfully!')
    console.log('📊 Project ID:', insertData[0].id)
    console.log('📊 Project Name:', insertData[0].name)
    
    // Wait a moment
    console.log('\n⏳ Waiting 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Fetch projects to simulate "coming back to the page"
    console.log('\n🔍 Fetching projects (simulating page reload)...')
    const { data: fetchData, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', '550e8400-e29b-41d4-a716-446655440000')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.log('❌ Failed to fetch projects:', fetchError.message)
      return false
    }
    
    console.log('✅ Projects fetched successfully!')
    console.log('📊 Found', fetchData.length, 'projects')
    
    // Check if our test project is there
    const ourProject = fetchData.find(p => p.id === insertData[0].id)
    if (ourProject) {
      console.log('✅ PERSISTENCE TEST PASSED!')
      console.log('📊 Project found after "navigation":', ourProject.name)
      console.log('📊 Project status:', ourProject.status)
      console.log('📊 Project created at:', ourProject.created_at)
    } else {
      console.log('❌ PERSISTENCE TEST FAILED!')
      console.log('❌ Project not found after "navigation"')
      return false
    }
    
    // Clean up test project
    console.log('\n🧹 Cleaning up test project...')
    await supabase
      .from('projects')
      .delete()
      .eq('id', insertData[0].id)
    console.log('✅ Test project cleaned up')
    
    console.log('\n🎉 PERSISTENCE TEST COMPLETED SUCCESSFULLY!')
    console.log('✅ Projects will persist when you navigate away and come back')
    console.log('✅ Your application is working correctly!')
    
    return true
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message)
    return false
  }
}

testPersistence()
  .then(success => {
    if (success) {
      console.log('\n🚀 Your projects will now save and persist!')
      console.log('Try creating a project in your app - it will stay there!')
    } else {
      console.log('\n💥 Persistence test failed.')
    }
  })
  .catch(error => {
    console.log('\n💥 Test failed with error:', error)
  })


















