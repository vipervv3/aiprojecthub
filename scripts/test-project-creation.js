const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function testProjectCreation() {
  console.log('Testing project creation...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // Create a test project
    const testProject = {
      name: 'My First Project',
      description: 'This is a test project created from the application',
      status: 'active',
      progress: 0,
      budget_allocated: 50000,
      budget_spent: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team_members: ['demo-user'],
      owner_id: '550e8400-e29b-41d4-a716-446655440000'
    }
    
    console.log('📝 Creating project:', testProject.name)
    
    const { data, error } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
    
    if (error) {
      console.log('❌ Error creating project:', error.message)
      console.log('🔍 Full error:', error)
      return false
    } else {
      console.log('✅ Project created successfully!')
      console.log('📊 Project ID:', data[0].id)
      console.log('📊 Project Name:', data[0].name)
      console.log('📊 Project Status:', data[0].status)
      
      // Test fetching the project
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
        fetchData.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (${project.status})`)
        })
      }
      
      return true
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message)
    return false
  }
}

testProjectCreation()
  .then(success => {
    if (success) {
      console.log('\n🎉 Project creation test passed!')
      console.log('💡 You can now create projects in the application!')
    } else {
      console.log('\n💥 Project creation test failed!')
      console.log('💡 You may need to disable RLS in your Supabase dashboard.')
    }
  })
  .catch(error => {
    console.log('\n💥 Test failed with error:', error)
  })




















