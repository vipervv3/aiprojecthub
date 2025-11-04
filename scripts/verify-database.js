#!/usr/bin/env node

/**
 * Database Verification Script
 * Checks if all required tables exist and have sample data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('\nPlease set:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDatabase() {
  console.log('🔍 Verifying AI ProjectHub Database Setup...\n')
  
  let allChecks = true
  
  // Check 1: Users table
  console.log('📋 Checking users table...')
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1)
    if (error) throw error
    console.log(`✅ Users table exists (${data?.length || 0} users found)`)
  } catch (error) {
    console.log('❌ Users table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 2: Projects table
  console.log('📋 Checking projects table...')
  try {
    const { data, error } = await supabase.from('projects').select('*')
    if (error) throw error
    console.log(`✅ Projects table exists (${data?.length || 0} projects found)`)
    if (data && data.length > 0) {
      console.log(`   Sample: "${data[0].name}"`)
    }
  } catch (error) {
    console.log('❌ Projects table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 3: Tasks table
  console.log('📋 Checking tasks table...')
  try {
    const { data, error } = await supabase.from('tasks').select('*')
    if (error) throw error
    console.log(`✅ Tasks table exists (${data?.length || 0} tasks found)`)
    if (data && data.length > 0) {
      console.log(`   Sample: "${data[0].title}"`)
    }
  } catch (error) {
    console.log('❌ Tasks table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 4: Activities table
  console.log('📋 Checking activities table...')
  try {
    const { data, error } = await supabase.from('activities').select('*').limit(1)
    if (error) throw error
    console.log(`✅ Activities table exists (${data?.length || 0} activities found)`)
  } catch (error) {
    console.log('❌ Activities table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 5: Meetings table
  console.log('📋 Checking meetings table...')
  try {
    const { data, error } = await supabase.from('meetings').select('*').limit(1)
    if (error) throw error
    console.log(`✅ Meetings table exists`)
  } catch (error) {
    console.log('❌ Meetings table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 6: Recording sessions table
  console.log('📋 Checking recording_sessions table...')
  try {
    const { data, error } = await supabase.from('recording_sessions').select('*').limit(1)
    if (error) throw error
    console.log(`✅ Recording sessions table exists`)
  } catch (error) {
    console.log('❌ Recording sessions table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 7: Notifications table
  console.log('📋 Checking notifications table...')
  try {
    const { data, error } = await supabase.from('notifications').select('*').limit(1)
    if (error) throw error
    console.log(`✅ Notifications table exists`)
  } catch (error) {
    console.log('❌ Notifications table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 8: AI Insights table
  console.log('📋 Checking ai_insights table...')
  try {
    const { data, error } = await supabase.from('ai_insights').select('*').limit(1)
    if (error) throw error
    console.log(`✅ AI Insights table exists`)
  } catch (error) {
    console.log('❌ AI Insights table missing or inaccessible')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Check 9: Demo user
  console.log('\n👤 Checking demo user...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@example.com')
      .single()
    
    if (error) throw error
    if (data) {
      console.log('✅ Demo user exists')
      console.log(`   Email: ${data.email}`)
      console.log(`   ID: ${data.id}`)
    }
  } catch (error) {
    console.log('❌ Demo user not found')
    console.log('   Error:', error.message)
    allChecks = false
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  if (allChecks) {
    console.log('✅ DATABASE SETUP COMPLETE!')
    console.log('\nYour database is ready to use.')
    console.log('\nNext steps:')
    console.log('  1. Run: npm run dev')
    console.log('  2. Open: http://localhost:3000')
    console.log('  3. Navigate to /dashboard to see your data')
  } else {
    console.log('❌ DATABASE SETUP INCOMPLETE')
    console.log('\nPlease run the database setup SQL:')
    console.log('  1. Open Supabase Dashboard')
    console.log('  2. Go to SQL Editor')
    console.log('  3. Run the contents of COMPLETE_DATABASE_SETUP.sql')
    console.log('  4. Run this script again to verify')
  }
  console.log('='.repeat(60))
}

verifyDatabase().catch(console.error)













