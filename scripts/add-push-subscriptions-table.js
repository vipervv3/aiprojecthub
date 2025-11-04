/**
 * Script to add push_subscriptions table to Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
-- Push Subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endpoint, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
`

async function addPushSubscriptionsTable() {
  try {
    console.log('🔗 Connecting to Supabase...')
    console.log('📝 Creating push_subscriptions table...')
    
    // Use Supabase's SQL execution via RPC (if available) or direct SQL
    // Since Supabase doesn't have a direct SQL execution endpoint,
    // we'll use the REST API to execute SQL
    
    // Try using the REST API with PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    })

    if (!response.ok) {
      // If RPC doesn't work, try creating the table using the client
      console.log('⚠️  RPC method not available, trying alternative method...')
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      console.log('\n📋 Manual Setup Required:')
      console.log('The Supabase JavaScript client cannot execute raw SQL directly.')
      console.log('Please run the SQL in the Supabase SQL Editor:\n')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Click "SQL Editor" in the left sidebar')
      console.log('4. Click "New Query"')
      console.log('5. Copy and paste the following SQL:\n')
      console.log('─'.repeat(60))
      console.log(sql)
      console.log('─'.repeat(60))
      console.log('\n6. Click "Run" to execute')
      console.log('\nAlternatively, the SQL file is available at: scripts/add-push-subscriptions-table.sql\n')
      
      // Test if table already exists
      const { error: testError } = await supabase
        .from('push_subscriptions')
        .select('id')
        .limit(1)
      
      if (!testError) {
        console.log('\n✅ Table already exists! No action needed.')
        return true
      } else {
        console.log('\n⚠️  Table does not exist yet. Please run the SQL above.')
        return false
      }
    } else {
      console.log('✅ push_subscriptions table created successfully!')
      
      // Verify table exists
      const { error: verifyError } = await supabase
        .from('push_subscriptions')
        .select('id')
        .limit(1)
      
      if (verifyError && verifyError.message.includes('Could not find the table')) {
        console.log('⚠️  Table creation may have failed. Please verify manually.')
        return false
      } else {
        console.log('✅ Table verified successfully!')
        return true
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📋 Manual Setup Required:')
    console.log('Please run the SQL in the Supabase SQL Editor:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Click "SQL Editor" in the left sidebar')
    console.log('4. Copy and paste the contents of scripts/add-push-subscriptions-table.sql')
    console.log('5. Click "Run" to execute')
    return false
  }
}

addPushSubscriptionsTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 Setup completed successfully!')
      process.exit(0)
    } else {
      console.log('\n📋 Please complete the manual setup steps above.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })

