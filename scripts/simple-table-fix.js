const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function fixTables() {
  console.log('🔧 Fixing database tables...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test if we can create a project (this will tell us if RLS is the issue)
    console.log('🧪 Testing project creation...')
    const testProject = {
      name: 'Test Project',
      description: 'Testing database setup',
      status: 'active',
      progress: 0,
      budget_allocated: 10000,
      budget_spent: 0,
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team_members: ['demo-user'],
      owner_id: '550e8400-e29b-41d4-a716-446655440000'
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert([testProject])
      .select()
    
    if (error) {
      console.log('❌ Project creation failed:', error.message)
      console.log('💡 This means you need to run the SQL manually in Supabase dashboard')
      console.log('📋 Copy this SQL and run it in your Supabase SQL Editor:')
      console.log('')
      console.log('-- Create missing tables and disable RLS')
      console.log('CREATE TABLE IF NOT EXISTS activities (')
      console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),')
      console.log('  action VARCHAR NOT NULL,')
      console.log('  entity_type VARCHAR NOT NULL,')
      console.log('  entity_id UUID NOT NULL,')
      console.log('  user_id UUID REFERENCES users(id) ON DELETE CASCADE,')
      console.log('  metadata JSONB DEFAULT \'{}\',')
      console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
      console.log(');')
      console.log('')
      console.log('ALTER TABLE projects DISABLE ROW LEVEL SECURITY;')
      console.log('ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;')
      console.log('ALTER TABLE activities DISABLE ROW LEVEL SECURITY;')
      console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('-- Then run this test again')
    } else {
      console.log('✅ Project created successfully!')
      console.log('🎉 Your database is working correctly!')
      
      // Clean up test project
      await supabase
        .from('projects')
        .delete()
        .eq('id', data[0].id)
      console.log('🧹 Test project cleaned up')
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

fixTables()




















