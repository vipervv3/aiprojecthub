console.log('🔍 Debugging application issues...')

// Check if we can access the data service
try {
  console.log('📝 Testing data service import...')
  const { dataService } = require('./lib/data-service')
  console.log('✅ Data service imported successfully')
  console.log('📊 Data service type:', typeof dataService)
  
  // Test if we can call methods
  console.log('📝 Testing data service methods...')
  console.log('📊 getProjects method:', typeof dataService.getProjects)
  console.log('📊 createProject method:', typeof dataService.createProject)
  
} catch (error) {
  console.log('❌ Error importing data service:', error.message)
}

// Check Supabase connection
try {
  console.log('\n📝 Testing Supabase connection...')
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log('✅ Supabase client created successfully')
  
} catch (error) {
  console.log('❌ Error creating Supabase client:', error.message)
}

console.log('\n🎯 Debug complete!')
console.log('💡 If you see any errors above, those are the issues to fix.')




















