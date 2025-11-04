const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function checkAllTables() {
  console.log('🔍 Checking all required tables in your Supabase database...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    // List of all required tables
    const requiredTables = [
      'users',
      'projects', 
      'tasks',
      'meetings',
      'notifications',
      'activities',
      'notification_templates',
      'notification_preferences'
    ]
    
    console.log('\n📋 Required tables:')
    requiredTables.forEach(table => console.log(`  - ${table}`))
    
    console.log('\n🔍 Checking each table...')
    
    const tableStatus = {}
    
    for (const tableName of requiredTables) {
      try {
        console.log(`\n📝 Checking ${tableName}...`)
        
        // Try to query the table
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
          tableStatus[tableName] = { exists: false, error: error.message }
        } else {
          console.log(`✅ ${tableName}: Table exists and accessible`)
          tableStatus[tableName] = { exists: true, count: data.length }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
        tableStatus[tableName] = { exists: false, error: err.message }
      }
    }
    
    console.log('\n📊 SUMMARY:')
    console.log('='.repeat(50))
    
    const missingTables = []
    const existingTables = []
    
    Object.entries(tableStatus).forEach(([table, status]) => {
      if (status.exists) {
        console.log(`✅ ${table}: EXISTS`)
        existingTables.push(table)
      } else {
        console.log(`❌ ${table}: MISSING (${status.error})`)
        missingTables.push(table)
      }
    })
    
    console.log('\n📈 RESULTS:')
    console.log(`✅ Existing tables: ${existingTables.length}/${requiredTables.length}`)
    console.log(`❌ Missing tables: ${missingTables.length}/${requiredTables.length}`)
    
    if (missingTables.length > 0) {
      console.log('\n🚨 MISSING TABLES:')
      missingTables.forEach(table => console.log(`  - ${table}`))
      
      console.log('\n💡 SOLUTION:')
      console.log('You need to run the SQL in your Supabase dashboard:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project: xekyfsnxrnfkdvrcsiye')
      console.log('3. Click "SQL Editor" → "New Query"')
      console.log('4. Copy and paste the contents of scripts/complete-database-setup.sql')
      console.log('5. Click "Run"')
    } else {
      console.log('\n🎉 ALL TABLES EXIST!')
      console.log('Your database is properly set up.')
    }
    
    // Test RLS status
    console.log('\n🔒 Testing Row Level Security...')
    try {
      const testProject = {
        name: 'RLS Test Project',
        description: 'Testing RLS status',
        status: 'active',
        progress: 0,
        budget_allocated: 1000,
        budget_spent: 0,
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        team_members: ['demo-user'],
        owner_id: '550e8400-e29b-41d4-a716-446655440000'
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert([testProject])
        .select()
      
      if (error) {
        if (error.message.includes('row-level security')) {
          console.log('❌ RLS is ENABLED - blocking project creation')
          console.log('💡 You need to disable RLS in Supabase dashboard')
        } else {
          console.log('❌ Project creation failed:', error.message)
        }
      } else {
        console.log('✅ RLS is DISABLED - project creation works!')
        // Clean up test project
        await supabase.from('projects').delete().eq('id', data[0].id)
        console.log('🧹 Test project cleaned up')
      }
    } catch (err) {
      console.log('❌ RLS test failed:', err.message)
    }
    
    return { tableStatus, missingTables, existingTables }
    
  } catch (error) {
    console.log('❌ Error checking tables:', error.message)
    return null
  }
}

checkAllTables()
  .then(result => {
    if (result) {
      if (result.missingTables.length === 0) {
        console.log('\n🚀 Your database is ready to use!')
      } else {
        console.log('\n⚠️  Database setup incomplete. Please run the SQL.')
      }
    }
  })
  .catch(error => {
    console.log('\n💥 Check failed with error:', error)
  })




















