#!/usr/bin/env node

/**
 * Create Supabase Storage Bucket for Meeting Recordings
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createBucket() {
  console.log('🚀 Creating storage bucket for meeting recordings...\n')
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return false
    }
    
    const existingBucket = buckets?.find(b => b.name === 'meeting-recordings')
    
    if (existingBucket) {
      console.log('✅ Storage bucket "meeting-recordings" already exists!')
      return true
    }
    
    // Create bucket
    const { data, error } = await supabase.storage.createBucket('meeting-recordings', {
      public: false,
      fileSizeLimit: 524288000, // 500MB
      allowedMimeTypes: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg']
    })
    
    if (error) {
      console.error('❌ Error creating bucket:', error)
      console.log('\n📋 MANUAL SETUP REQUIRED:')
      console.log('1. Go to: https://supabase.com/dashboard')
      console.log('2. Open your project')
      console.log('3. Click "Storage" in left sidebar')
      console.log('4. Click "New bucket"')
      console.log('5. Enter:')
      console.log('   - Name: meeting-recordings')
      console.log('   - Public: NO (uncheck)')
      console.log('   - File size limit: 500 MB')
      console.log('6. Click "Create bucket"')
      return false
    }
    
    console.log('✅ Storage bucket "meeting-recordings" created successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function updateDatabase() {
  console.log('\n📦 Updating database schema...\n')
  
  try {
    // Check if recording_sessions table has the new columns
    const { data, error } = await supabase
      .from('recording_sessions')
      .select('project_id, chunks, upload_progress, storage_path')
      .limit(1)
    
    if (error) {
      console.log('⚠️  recording_sessions table might need updates')
      console.log('   Run scripts/setup-storage-bucket.sql in Supabase SQL Editor')
    } else {
      console.log('✅ recording_sessions table has required columns')
    }
    
    // Check if meeting_tasks table exists
    const { data: mtData, error: mtError } = await supabase
      .from('meeting_tasks')
      .select('*')
      .limit(1)
    
    if (mtError && mtError.code === '42P01') {
      console.log('⚠️  meeting_tasks table does not exist')
      console.log('   Run scripts/setup-storage-bucket.sql in Supabase SQL Editor')
    } else if (!mtError) {
      console.log('✅ meeting_tasks table exists')
    }
    
  } catch (error) {
    console.error('Error checking database:', error)
  }
}

async function main() {
  console.log('=' .repeat(60))
  console.log('  MEETING RECORDING STORAGE SETUP')
  console.log('=' .repeat(60) + '\n')
  
  const bucketCreated = await createBucket()
  await updateDatabase()
  
  console.log('\n' + '=' .repeat(60))
  
  if (bucketCreated) {
    console.log('✅ SETUP COMPLETE!')
    console.log('=' .repeat(60))
    console.log('\nYou can now:')
    console.log('1. Start recording meetings')
    console.log('2. Chunks will upload to Supabase automatically')
    console.log('3. Recordings will appear on /meetings page')
    console.log('\nNext: Run scripts/setup-storage-bucket.sql in Supabase SQL Editor')
  } else {
    console.log('⚠️  MANUAL SETUP REQUIRED')
    console.log('=' .repeat(60))
    console.log('\nPlease create the storage bucket manually in Supabase Dashboard')
  }
  
  console.log('\n' + '=' .repeat(60))
}

main()
  .then(() => {
    console.log('\n✅ Script complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })




