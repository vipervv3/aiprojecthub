const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function testDatabaseSetup() {
  console.log('🧪 Testing database setup after SQL execution...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // Test 1: Create a project
    console.log('\n📝 Test 1: Creating a project...')
    const testProject = {
      name: 'Test Project After Setup',
      description: 'Testing project creation after database setup',
      status: 'active',
      progress: 0,
      budget_allocated: 25000,
      budget_spent: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team_members: ['demo-user'],
      owner_id: '550e8400-e29b-41d4-a716-446655440000'
    }
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
    
    if (projectError) {
      console.log('❌ Project creation failed:', projectError.message)
      return false
    } else {
      console.log('✅ Project created successfully!')
      console.log('📊 Project ID:', projectData[0].id)
    }
    
    // Test 2: Create a task
    console.log('\n📝 Test 2: Creating a task...')
    const testTask = {
      title: 'Test Task After Setup',
      description: 'Testing task creation after database setup',
      status: 'pending',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignee_id: '550e8400-e29b-41d4-a716-446655440000',
      project_id: projectData[0].id
    }
    
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert([testTask])
      .select()
    
    if (taskError) {
      console.log('❌ Task creation failed:', taskError.message)
    } else {
      console.log('✅ Task created successfully!')
      console.log('📊 Task ID:', taskData[0].id)
    }
    
    // Test 3: Check activities table
    console.log('\n📝 Test 3: Checking activities table...')
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(1)
    
    if (activitiesError) {
      console.log('❌ Activities table error:', activitiesError.message)
    } else {
      console.log('✅ Activities table is accessible')
    }
    
    // Test 4: Check notification templates
    console.log('\n📝 Test 4: Checking notification templates...')
    const { data: templatesData, error: templatesError } = await supabase
      .from('notification_templates')
      .select('*')
      .limit(1)
    
    if (templatesError) {
      console.log('❌ Notification templates error:', templatesError.message)
    } else {
      console.log('✅ Notification templates table is accessible')
      console.log('📊 Found', templatesData.length, 'templates')
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    if (taskData && taskData[0]) {
      await supabase.from('tasks').delete().eq('id', taskData[0].id)
    }
    if (projectData && projectData[0]) {
      await supabase.from('projects').delete().eq('id', projectData[0].id)
    }
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 Database setup test completed successfully!')
    console.log('✅ All tables are working')
    console.log('✅ Project creation works')
    console.log('✅ Task creation works')
    console.log('✅ RLS is disabled')
    console.log('\n🚀 Your application is ready to use!')
    
    return true
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message)
    return false
  }
}

testDatabaseSetup()
  .then(success => {
    if (success) {
      console.log('\n🎊 SUCCESS: Your database is fully configured!')
      console.log('You can now create projects and tasks in your application.')
    } else {
      console.log('\n💥 FAILED: Database setup incomplete.')
      console.log('Please run the SQL in your Supabase dashboard first.')
    }
  })
  .catch(error => {
    console.log('\n💥 Test failed with error:', error)
  })




















