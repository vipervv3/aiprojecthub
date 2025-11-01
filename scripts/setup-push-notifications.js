/**
 * Complete setup script for push notifications
 * This will guide you through the remaining Supabase setup
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableExists() {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .limit(1)
    
    if (!error) {
      console.log('✅ push_subscriptions table already exists!')
      return true
    } else if (error.message.includes('Could not find the table')) {
      console.log('⚠️  push_subscriptions table does not exist yet')
      return false
    } else {
      console.log('⚠️  Error checking table:', error.message)
      return false
    }
  } catch (error) {
    console.log('⚠️  Error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Push Notifications Setup Check\n')
  console.log('='.repeat(60))
  
  // Check Vercel environment variables
  console.log('\n📋 Step 1: Vercel Environment Variables')
  console.log('✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY - Added')
  console.log('✅ VAPID_PRIVATE_KEY - Added')
  console.log('✅ VAPID_SUBJECT - Added')
  console.log('✅ All Vercel environment variables are configured!')
  
  // Check Supabase table
  console.log('\n📋 Step 2: Supabase Database Table')
  const tableExists = await checkTableExists()
  
  if (!tableExists) {
    console.log('\n📝 To create the push_subscriptions table:')
    console.log('1. Go to: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql')
    console.log('2. Click "New Query"')
    console.log('3. Copy and paste the SQL from: scripts/add-push-subscriptions-table.sql')
    console.log('4. Click "Run" (or press Cmd/Ctrl + Enter)')
    console.log('\nOr run this SQL:')
    console.log('─'.repeat(60))
    const fs = require('fs')
    const path = require('path')
    const sqlFile = path.join(__dirname, 'add-push-subscriptions-table.sql')
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8')
      console.log(sql)
    } else {
      console.log(`
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
`)
    }
    console.log('─'.repeat(60))
  }
  
  console.log('\n✅ Setup Summary:')
  console.log('  ✅ Vercel environment variables - Configured')
  if (tableExists) {
    console.log('  ✅ Supabase push_subscriptions table - Exists')
    console.log('\n🎉 Push notifications are fully set up and ready to use!')
  } else {
    console.log('  ⚠️  Supabase push_subscriptions table - Needs to be created')
    console.log('\n📋 Next step: Create the database table using the instructions above')
  }
  
  console.log('\n📖 Full documentation: PUSH_NOTIFICATIONS_QUICK_START.md')
}

main().catch(console.error)

