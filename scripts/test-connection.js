const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing')
console.log('Service Key:', supabaseServiceKey ? '✅ Present' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Test with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🧪 Testing basic connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('ℹ️  Users table not found (expected if not set up yet)')
      console.log('Error:', error.message)
    } else {
      console.log('✅ Connection successful!')
      console.log('Data:', data)
    }
    
    // Test auth
    console.log('\n🔐 Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('ℹ️  No active session (expected)')
    } else {
      console.log('✅ Auth system working!')
    }
    
    console.log('\n🎉 Supabase connection test completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Run the database schema setup')
    console.log('2. Test the application at http://localhost:3000')
    console.log('3. Create a user account to test functionality')
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
  }
}

testConnection()





















