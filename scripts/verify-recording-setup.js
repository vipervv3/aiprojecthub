#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://xekyfsnxrnfkdvrcsiye.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'
)

async function verify() {
  console.log('🔍 Verifying Recording Setup...\n')
  console.log('='.repeat(70))
  
  let allGood = true
  
  // Check recording_sessions columns
  console.log('\n📋 Checking recording_sessions table...')
  try {
    const { data, error } = await supabase
      .from('recording_sessions')
      .select('id, project_id, chunks, upload_progress, storage_path')
      .limit(1)
    
    if (error) {
      console.log('❌ recording_sessions: Missing columns')
      console.log('   Error:', error.message)
      allGood = false
    } else {
      console.log('✅ recording_sessions: Has all required columns')
      console.log('   ✓ project_id')
      console.log('   ✓ chunks')
      console.log('   ✓ upload_progress')
      console.log('   ✓ storage_path')
    }
  } catch (error) {
    console.log('❌ Error checking recording_sessions:', error.message)
    allGood = false
  }
  
  // Check meeting_tasks table
  console.log('\n📋 Checking meeting_tasks table...')
  try {
    const { data, error } = await supabase
      .from('meeting_tasks')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.log('❌ meeting_tasks: Table does NOT exist')
      allGood = false
    } else if (error) {
      console.log('⚠️  meeting_tasks: Error:', error.message)
    } else {
      console.log('✅ meeting_tasks: Table exists')
    }
  } catch (error) {
    console.log('❌ Error checking meeting_tasks:', error.message)
    allGood = false
  }
  
  // Check storage bucket
  console.log('\n📦 Checking storage bucket...')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.log('❌ Error listing buckets:', error.message)
      allGood = false
    } else {
      const bucket = buckets?.find(b => b.name === 'meeting-recordings')
      
      if (bucket) {
        console.log('✅ Storage bucket: meeting-recordings EXISTS')
        console.log('   Public:', bucket.public ? 'YES ✅' : 'NO')
        console.log('   File size limit:', bucket.file_size_limit || 'Default')
        
        if (!bucket.public) {
          console.log('   ⚠️  WARNING: Bucket is private - may cause RLS errors')
          console.log('   Recommendation: Make it public or add policies')
        }
      } else {
        console.log('❌ Storage bucket: meeting-recordings NOT FOUND')
        allGood = false
      }
    }
  } catch (error) {
    console.log('❌ Error checking storage:', error.message)
    allGood = false
  }
  
  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📊 SETUP STATUS')
  console.log('='.repeat(70))
  
  if (allGood) {
    console.log('\n✅ ALL CHECKS PASSED!')
    console.log('\nYour recording system is ready to use!')
    console.log('→ Refresh browser (F5)')
    console.log('→ Click red microphone button')
    console.log('→ Start recording!')
  } else {
    console.log('\n⚠️  SETUP INCOMPLETE')
    console.log('\nPlease run: scripts/FINAL_RECORDING_SETUP.sql')
    console.log('In Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new')
  }
  
  console.log('\n' + '='.repeat(70))
}

verify().catch(console.error)




