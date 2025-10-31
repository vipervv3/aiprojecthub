const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('🔗 Connecting to Supabase...')
    
    // Test connection
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected
      console.error('❌ Failed to connect to Supabase:', error)
      return
    }
    
    console.log('✅ Connected to Supabase successfully!')
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'lib', 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📄 Reading database schema...')
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.warn(`⚠️  Warning for statement ${i + 1}:`, error.message)
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.warn(`⚠️  Warning for statement ${i + 1}:`, err.message)
        }
      }
    }
    
    console.log('🎉 Database setup completed!')
    console.log('📋 Next steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Authentication > Users')
    console.log('3. Try registering a new user in your app')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
  }
}

// Run the setup
setupDatabase()