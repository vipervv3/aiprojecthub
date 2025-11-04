const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzExMDgsImV4cCI6MjA3NDk0NzEwOH0.mV9Ag7xvHJTPaMVgnVFvhu9L2C2Y3qJRzJDCs0ybthw'

async function checkTables() {
  console.log('Checking which tables exist in your Supabase database...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client created successfully')
    
    const tables = ['projects', 'tasks', 'activities', 'users', 'meetings', 'notifications']
    const results = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          if (error.message.includes('does not exist')) {
            results[table] = '❌ Missing'
            console.log(`❌ Table '${table}' does not exist`)
          } else {
            results[table] = '⚠️ Error: ' + error.message
            console.log(`⚠️ Table '${table}' has error: ${error.message}`)
          }
        } else {
          results[table] = '✅ Exists'
          console.log(`✅ Table '${table}' exists`)
        }
      } catch (err) {
        results[table] = '❌ Error: ' + err.message
        console.log(`❌ Table '${table}' error: ${err.message}`)
      }
    }
    
    console.log('\n📊 Table Status Summary:')
    console.log('========================')
    Object.entries(results).forEach(([table, status]) => {
      console.log(`${table.padEnd(15)} ${status}`)
    })
    
    const missingTables = Object.entries(results).filter(([_, status]) => status.includes('❌ Missing'))
    
    if (missingTables.length > 0) {
      console.log('\n🔧 Missing Tables:')
      missingTables.forEach(([table, _]) => {
        console.log(`  - ${table}`)
      })
      console.log('\n💡 You need to run the SQL script in your Supabase dashboard to create missing tables.')
    } else {
      console.log('\n🎉 All tables exist!')
    }
    
  } catch (error) {
    console.log('❌ Check failed with error:', error.message)
  }
}

checkTables()




















