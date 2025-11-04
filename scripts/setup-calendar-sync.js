/**
 * Setup Calendar Sync Tables
 * Creates calendar_syncs and synced_events tables in Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    // If RPC doesn't exist, try direct query
    try {
      const { data, error: queryError } = await supabase.from('_sql').select('*').limit(0)
      // This won't work, but we'll handle it
      throw new Error('Direct SQL execution not supported via Supabase client')
    } catch {
      return { success: false, error }
    }
  }
}

async function setup() {
  console.log('🚀 Setting up Calendar Sync tables...\n')

  // Read the SQL file
  const sqlPath = path.join(__dirname, 'CALENDAR_SYNC_SETUP.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('📄 SQL file loaded\n')
  console.log('⚠️  Note: Supabase JS client does not support direct SQL execution.')
  console.log('📋 Please run the SQL manually in your Supabase Dashboard:\n')
  console.log('   1. Go to: https://supabase.com/dashboard')
  console.log('   2. Select your project')
  console.log('   3. Go to SQL Editor')
  console.log('   4. Paste and run the SQL from:', sqlPath)
  console.log('\n' + '='.repeat(80))
  console.log('\n📝 SQL TO RUN:\n')
  console.log(sql)
  console.log('\n' + '='.repeat(80))

  // Try to check if tables exist
  console.log('\n🔍 Checking if tables already exist...\n')

  const { data: calendarSyncs, error: syncError } = await supabase
    .from('calendar_syncs')
    .select('count')
    .limit(0)

  const { data: syncedEvents, error: eventsError } = await supabase
    .from('synced_events')
    .select('count')
    .limit(0)

  if (!syncError) {
    console.log('✅ calendar_syncs table exists')
  } else {
    console.log('❌ calendar_syncs table does not exist')
  }

  if (!eventsError) {
    console.log('✅ synced_events table exists')
  } else {
    console.log('❌ synced_events table does not exist')
  }

  // Check if meeting_source column exists
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('meeting_source')
    .limit(1)

  if (!meetingsError) {
    console.log('✅ meetings.meeting_source column exists')
  } else {
    console.log('❌ meetings.meeting_source column needs to be added')
  }

  console.log('\n✅ Setup check complete!')
  console.log('\nIf any tables are missing, please run the SQL manually.')
}

setup().catch(error => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})




