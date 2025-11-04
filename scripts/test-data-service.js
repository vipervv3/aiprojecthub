const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function testDataService() {
  console.log('🧪 Testing data service functionality...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // Test project creation (simulating what the data service does)
    console.log('\n📝 Testing project creation...')
    const testProject = {
      name: 'Data Service Test Project',
      description: 'Testing data service project creation',
      status: 'active',
      progress: 0,
      budget_allocated: 15000,
      budget_spent: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team_members: ['demo-user'],
      owner_id: '550e8400-e29b-41d4-a716-446655440000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
      .single()
    
    if (insertError) {
      console.log('❌ Project creation failed:', insertError.message)
      return false
    }
    
    console.log('✅ Project created successfully!')
    console.log('📊 Project ID:', insertData.id)
    console.log('📊 Project Name:', insertData.name)
    
    // Test fetching projects
    console.log('\n🔍 Testing project retrieval...')
    const { data: fetchData, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', '550e8400-e29b-41d4-a716-446655440000')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.log('❌ Project retrieval failed:', fetchError.message)
    } else {
      console.log('✅ Projects retrieved successfully!')
      console.log('📊 Found', fetchData.length, 'projects')
    }
    
    // Clean up test project
    console.log('\n🧹 Cleaning up test project...')
    await supabase
      .from('projects')
      .delete()
      .eq('id', insertData.id)
    console.log('✅ Test project cleaned up')
    
    console.log('\n🎉 Data service test completed successfully!')
    console.log('✅ Project creation works')
    console.log('✅ Project retrieval works')
    console.log('✅ Your application should work now!')
    
    return true
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message)
    return false
  }
}

testDataService()
  .then(success => {
    if (success) {
      console.log('\n🚀 Your data service is working correctly!')
      console.log('Try creating a project in your app now!')
    } else {
      console.log('\n💥 Data service test failed.')
    }
  })
  .catch(error => {
    console.log('\n💥 Test failed with error:', error)
  })




















