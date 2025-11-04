/**
 * AUTOMATIC USER ID FIX SCRIPT
 * 
 * This script will:
 * 1. Connect to your Supabase database
 * 2. Find your real auth user ID
 * 3. Update ALL data to use the correct user ID
 * 4. Re-enable RLS policies
 * 
 * Run with: node fix-user-ids-auto.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function main() {
  log('\n========================================', 'cyan')
  log('🔧 AUTOMATIC USER ID FIX', 'cyan')
  log('========================================\n', 'cyan')

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    log('❌ ERROR: Missing Supabase credentials!', 'red')
    log('Make sure .env.local has:', 'yellow')
    log('  - NEXT_PUBLIC_SUPABASE_URL', 'yellow')
    log('  - SUPABASE_SERVICE_ROLE_KEY', 'yellow')
    process.exit(1)
  }

  log('✅ Connecting to Supabase...', 'green')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // ================================================
  // STEP 1: Find all users
  // ================================================
  log('\n📋 STEP 1: Finding users in auth system...', 'blue')
  
  const { data: authUsers, error: authError } = await supabase.rpc('exec', {
    query: 'SELECT id, email, created_at FROM auth.users ORDER BY created_at ASC'
  })

  // Alternative method using auth admin
  let users = []
  try {
    // Try to get users from auth
    const { data: { users: authUsersList } } = await supabase.auth.admin.listUsers()
    users = authUsersList
  } catch (error) {
    log('⚠️  Could not fetch users via admin API', 'yellow')
  }

  if (users.length === 0) {
    log('⚠️  Trying alternative method to find users...', 'yellow')
    // Get users from data tables instead
    const { data: projectUsers } = await supabase
      .from('projects')
      .select('owner_id')
      .limit(1)
    
    const { data: recordingUsers } = await supabase
      .from('recording_sessions')
      .select('user_id')
      .limit(1)
    
    if (projectUsers?.[0]) {
      log(`\n📌 Found user ID in projects: ${projectUsers[0].owner_id}`, 'cyan')
    }
    if (recordingUsers?.[0]) {
      log(`📌 Found user ID in recordings: ${recordingUsers[0].user_id}`, 'cyan')
    }
  } else {
    log(`\n✅ Found ${users.length} user(s):`, 'green')
    users.forEach((user, index) => {
      log(`  ${index + 1}. ${user.email} - ${user.id}`, 'cyan')
    })
  }

  // ================================================
  // STEP 2: Get the wrong user ID from data
  // ================================================
  log('\n📋 STEP 2: Finding user IDs in your data...', 'blue')
  
  const wrongUserId = '0d29164e-53f6-4a05-a070-e8cae3f7ec31'
  
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', wrongUserId)
  
  const { count: recordingCount } = await supabase
    .from('recording_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', wrongUserId)
  
  const { count: activityCount } = await supabase
    .from('activity_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', wrongUserId)

  log(`\n📊 Data with old user ID (${wrongUserId}):`, 'yellow')
  log(`  - Projects: ${projectCount || 0}`, 'yellow')
  log(`  - Recordings: ${recordingCount || 0}`, 'yellow')
  log(`  - Activities: ${activityCount || 0}`, 'yellow')

  if (!projectCount && !recordingCount && !activityCount) {
    log('\n❌ No data found with the old user ID!', 'red')
    log('This might mean:', 'yellow')
    log('  1. Data was already updated', 'yellow')
    log('  2. The wrong user ID is different', 'yellow')
    log('  3. There is no data in the database', 'yellow')
    process.exit(0)
  }

  // ================================================
  // STEP 3: Get the correct user ID
  // ================================================
  log('\n📋 STEP 3: Determining correct user ID...', 'blue')
  
  if (users.length === 0) {
    log('❌ Could not automatically determine correct user ID', 'red')
    log('Please run this manually in Supabase SQL Editor:', 'yellow')
    log('SELECT id, email FROM auth.users ORDER BY created_at ASC;', 'cyan')
    process.exit(1)
  }

  const correctUserId = users[0].id
  log(`✅ Using user ID: ${correctUserId}`, 'green')
  log(`   Email: ${users[0].email}`, 'green')

  // Ask for confirmation
  log('\n⚠️  IMPORTANT: This will update ALL data!', 'yellow')
  log('Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow')
  await new Promise(resolve => setTimeout(resolve, 5000))

  // ================================================
  // STEP 4: Disable RLS temporarily
  // ================================================
  log('\n📋 STEP 4: Temporarily disabling RLS...', 'blue')
  
  const tables = [
    'users', 'projects', 'tasks', 'recording_sessions', 
    'meetings', 'ai_insights', 'notifications', 
    'activity_log', 'notification_schedules'
  ]

  for (const table of tables) {
    try {
      await supabase.rpc('exec', {
        query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
      })
      log(`  ✅ Disabled RLS on ${table}`, 'green')
    } catch (error) {
      log(`  ⚠️  Could not disable RLS on ${table}: ${error.message}`, 'yellow')
    }
  }

  // ================================================
  // STEP 5: Update all data
  // ================================================
  log('\n📋 STEP 5: Updating all data with correct user ID...', 'blue')

  // Update projects
  const { error: projectError } = await supabase
    .from('projects')
    .update({ owner_id: correctUserId })
    .eq('owner_id', wrongUserId)
  
  if (!projectError) {
    log(`  ✅ Updated projects`, 'green')
  } else {
    log(`  ⚠️  Projects update: ${projectError.message}`, 'yellow')
  }

  // Update recording_sessions
  const { error: recordingError } = await supabase
    .from('recording_sessions')
    .update({ user_id: correctUserId })
    .eq('user_id', wrongUserId)
  
  if (!recordingError) {
    log(`  ✅ Updated recording sessions`, 'green')
  } else {
    log(`  ⚠️  Recordings update: ${recordingError.message}`, 'yellow')
  }

  // Update activity_log
  const { error: activityError } = await supabase
    .from('activity_log')
    .update({ user_id: correctUserId })
    .eq('user_id', wrongUserId)
  
  if (!activityError) {
    log(`  ✅ Updated activity log`, 'green')
  } else {
    log(`  ⚠️  Activity update: ${activityError.message}`, 'yellow')
  }

  // Update notifications
  const { error: notificationError } = await supabase
    .from('notifications')
    .update({ user_id: correctUserId })
    .eq('user_id', wrongUserId)
  
  if (!notificationError) {
    log(`  ✅ Updated notifications`, 'green')
  } else {
    log(`  ⚠️  Notifications update: ${notificationError.message}`, 'yellow')
  }

  // Update ai_insights
  const { error: insightsError } = await supabase
    .from('ai_insights')
    .update({ user_id: correctUserId })
    .eq('user_id', wrongUserId)
  
  if (!insightsError) {
    log(`  ✅ Updated AI insights`, 'green')
  } else {
    log(`  ⚠️  AI insights update: ${insightsError.message}`, 'yellow')
  }

  // ================================================
  // STEP 6: Verify updates
  // ================================================
  log('\n📋 STEP 6: Verifying updates...', 'blue')

  const { count: newProjectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', correctUserId)
  
  const { count: newRecordingCount } = await supabase
    .from('recording_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', correctUserId)
  
  const { count: taskCount } = await supabase
    .from('tasks')
    .select('*, projects!inner(*)', { count: 'exact', head: true })
    .eq('projects.owner_id', correctUserId)

  log(`\n📊 Data with correct user ID (${correctUserId}):`, 'green')
  log(`  - Projects: ${newProjectCount || 0}`, 'green')
  log(`  - Recordings: ${newRecordingCount || 0}`, 'green')
  log(`  - Tasks: ${taskCount || 0}`, 'green')

  // ================================================
  // STEP 7: Re-enable RLS
  // ================================================
  log('\n📋 STEP 7: Re-enabling RLS...', 'blue')

  for (const table of tables) {
    try {
      await supabase.rpc('exec', {
        query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      })
      log(`  ✅ Enabled RLS on ${table}`, 'green')
    } catch (error) {
      log(`  ⚠️  Could not enable RLS on ${table}: ${error.message}`, 'yellow')
    }
  }

  // ================================================
  // DONE!
  // ================================================
  log('\n========================================', 'cyan')
  log('✅ FIX COMPLETE!', 'green')
  log('========================================\n', 'cyan')

  log('📋 Next steps:', 'blue')
  log('  1. Refresh your app (Ctrl+F5)', 'cyan')
  log('  2. Check if you can see your projects/tasks', 'cyan')
  log('  3. Login as another user', 'cyan')
  log('  4. Verify they see ZERO of your data', 'cyan')
  log('')
}

// Run the script
main().catch(error => {
  log(`\n❌ ERROR: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})

