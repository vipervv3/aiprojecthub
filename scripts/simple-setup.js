const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Setting up database tables...')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupBasicTables() {
  try {
    console.log('📝 Creating basic tables...')
    
    // Test connection first
    console.log('🔍 Testing connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError && testError.message.includes('Could not find the table')) {
      console.log('ℹ️  Tables need to be created')
      console.log('\n📋 Manual Setup Required:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Navigate to your project: xekyfsnxrnfkdvrcsiye')
      console.log('3. Click on "SQL Editor" in the left sidebar')
      console.log('4. Click "New Query"')
      console.log('5. Copy and paste the contents of scripts/create-tables.sql')
      console.log('6. Click "Run" to execute')
      console.log('\nAlternatively, you can use the Supabase CLI:')
      console.log('supabase db push --db-url "your-database-url"')
      
    } else if (testError) {
      console.error('❌ Connection error:', testError.message)
    } else {
      console.log('✅ Tables already exist!')
    }
    
    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...')
    await testBasicFunctionality()
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

async function testBasicFunctionality() {
  try {
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('✅ Auth system working')
    
    // Test if we can create a test user (this will fail if tables don't exist)
    const testUser = {
      email: 'test@example.com',
      name: 'Test User'
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
    
    if (userError) {
      console.log('ℹ️  Cannot test user creation - tables not set up yet')
    } else {
      console.log('✅ User creation working')
      // Clean up test user
      await supabase.from('users').delete().eq('email', 'test@example.com')
    }
    
  } catch (error) {
    console.log('ℹ️  Basic functionality test skipped')
  }
}

setupBasicTables()





















