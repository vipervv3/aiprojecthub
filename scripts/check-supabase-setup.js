#!/usr/bin/env node

/**
 * Diagnostic script to check Supabase setup for recordings
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase Setup...\n')
  
  // 1. Check if recording_sessions table exists and has data
  console.log('1️⃣ Checking recording_sessions table...')
  try {
    const { data, error, count } = await supabase
      .from('recording_sessions')
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.log('   ❌ Error:', error.message)
    } else {
      console.log(`   ✅ Table exists with ${count} total recordings`)
      if (data && data.length > 0) {
        console.log('   📋 Sample recordings:')
        data.forEach((rec, i) => {
          console.log(`      ${i+1}. "${rec.title}" - ${rec.transcription_status} - ${rec.created_at}`)
          console.log(`         File: ${rec.file_path}`)
        })
      } else {
        console.log('   ⚠️  No recordings found in database')
      }
    }
  } catch (err) {
    console.log('   ❌ Failed:', err.message)
  }
  
  console.log('')
  
  // 2. Check storage buckets
  console.log('2️⃣ Checking storage buckets...')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.log('   ❌ Error:', error.message)
    } else {
      console.log(`   ✅ Found ${buckets.length} buckets:`)
      buckets.forEach(bucket => {
        console.log(`      - ${bucket.name} (${bucket.public ? 'PUBLIC' : 'PRIVATE'})`)
      })
      
      const recordingsBucket = buckets.find(b => b.name === 'recordings')
      if (!recordingsBucket) {
        console.log('   ❌ "recordings" bucket NOT FOUND!')
        console.log('   👉 You need to create a "recordings" bucket in Supabase')
      } else {
        console.log(`   ✅ "recordings" bucket exists (${recordingsBucket.public ? 'PUBLIC' : 'PRIVATE'})`)
      }
    }
  } catch (err) {
    console.log('   ❌ Failed:', err.message)
  }
  
  console.log('')
  
  // 3. Check if recordings bucket has files
  console.log('3️⃣ Checking files in recordings bucket...')
  try {
    const { data: files, error } = await supabase.storage
      .from('recordings')
      .list('', { limit: 10 })
    
    if (error) {
      console.log('   ❌ Error:', error.message)
      if (error.message.includes('not found')) {
        console.log('   👉 The "recordings" bucket does not exist!')
      }
    } else {
      console.log(`   ✅ Found ${files.length} items in bucket root`)
      if (files.length > 0) {
        console.log('   📁 Files/folders:')
        files.forEach(file => {
          console.log(`      - ${file.name} (${file.metadata?.size || 'folder'})`)
        })
      }
    }
  } catch (err) {
    console.log('   ❌ Failed:', err.message)
  }
  
  console.log('')
  
  // 4. Check users table
  console.log('4️⃣ Checking users...')
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('id, email, name', { count: 'exact' })
      .limit(3)
    
    if (error) {
      console.log('   ❌ Error:', error.message)
    } else {
      console.log(`   ✅ Found ${count} users`)
      if (data && data.length > 0) {
        console.log('   👤 Sample users:')
        data.forEach(user => {
          console.log(`      - ${user.name} (${user.email})`)
          console.log(`        ID: ${user.id}`)
        })
      }
    }
  } catch (err) {
    console.log('   ❌ Failed:', err.message)
  }
  
  console.log('')
  console.log('✅ Diagnostic complete!')
  console.log('')
  console.log('💡 Next steps:')
  console.log('   1. If "recordings" bucket is missing, create it in Supabase dashboard')
  console.log('   2. Make sure bucket is PUBLIC')
  console.log('   3. Set up storage policies to allow uploads')
  console.log('   4. Try recording again')
}

checkSupabaseSetup().catch(console.error)

