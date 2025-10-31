#!/usr/bin/env node

/**
 * Complete Recording Setup Script
 * This will set up everything needed for the meeting recording system
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 Complete Recording Setup Starting...\n')
console.log('=' .repeat(70))

async function createStorageBucket() {
  console.log('\n📦 STEP 1: Creating Storage Bucket')
  console.log('-'.repeat(70))
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      return false
    }
    
    const existing = buckets?.find(b => b.name === 'meeting-recordings')
    
    if (existing) {
      console.log('✅ Storage bucket "meeting-recordings" already exists!')
      return true
    }
    
    // Try to create via API first
    const { data, error } = await supabase.storage.createBucket('meeting-recordings', {
      public: false,
      fileSizeLimit: 104857600, // 100MB (API limitation)
    })
    
    if (error) {
      console.log('⚠️  API creation failed:', error.message)
      console.log('   Creating via SQL instead...')
      
      // Create via SQL
      const sql = `
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
          'meeting-recordings',
          'meeting-recordings', 
          false,
          524288000,
          ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
        )
        ON CONFLICT (id) DO NOTHING;
      `
      
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql })
      
      if (sqlError) {
        console.error('❌ SQL creation also failed:', sqlError.message)
        return false
      }
      
      console.log('✅ Storage bucket created via SQL!')
      return true
    }
    
    console.log('✅ Storage bucket "meeting-recordings" created!')
    return true
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function setupDatabaseSchema() {
  console.log('\n📋 STEP 2: Setting Up Database Schema')
  console.log('-'.repeat(70))
  
  const sql = `
-- Add columns to recording_sessions table
ALTER TABLE recording_sessions 
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chunks JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS upload_progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Create meeting_tasks join table
CREATE TABLE IF NOT EXISTS meeting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, task_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recording_sessions_project_id ON recording_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_task_id ON meeting_tasks(task_id);

-- Disable RLS for development
ALTER TABLE meeting_tasks DISABLE ROW LEVEL SECURITY;

-- Update meetings table to support recording type
DO $$ 
BEGIN
  -- Check if meeting_type constraint exists and update it
  ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_meeting_type_check;
  ALTER TABLE meetings ADD CONSTRAINT meetings_meeting_type_check 
    CHECK (meeting_type IN ('regular', 'standup', 'review', 'planning', 'recording'));
EXCEPTION
  WHEN OTHERS THEN
    -- Constraint might not exist, that's okay
    NULL;
END $$;
`
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.log('⚠️  RPC exec_sql not available, trying direct execution...')
      
      // Try each statement separately
      const statements = [
        "ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL",
        "ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS chunks JSONB DEFAULT '[]'",
        "ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS upload_progress INTEGER DEFAULT 0",
        "ALTER TABLE recording_sessions ADD COLUMN IF NOT EXISTS storage_path TEXT",
        `CREATE TABLE IF NOT EXISTS meeting_tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(meeting_id, task_id)
        )`,
        "CREATE INDEX IF NOT EXISTS idx_recording_sessions_project_id ON recording_sessions(project_id)",
        "CREATE INDEX IF NOT EXISTS idx_meeting_tasks_meeting_id ON meeting_tasks(meeting_id)",
        "CREATE INDEX IF NOT EXISTS idx_meeting_tasks_task_id ON meeting_tasks(task_id)",
        "ALTER TABLE meeting_tasks DISABLE ROW LEVEL SECURITY"
      ]
      
      console.log('📋 Manual SQL execution required. Run this in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(70))
      console.log(sql)
      console.log('='.repeat(70) + '\n')
      
      return false
    }
    
    console.log('✅ Database schema updated successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📋 Please run scripts/setup-storage-bucket.sql manually in Supabase SQL Editor')
    return false
  }
}

async function verifySetup() {
  console.log('\n🔍 STEP 3: Verifying Setup')
  console.log('-'.repeat(70))
  
  let allGood = true
  
  // Check storage bucket
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucket = buckets?.find(b => b.name === 'meeting-recordings')
    
    if (bucket) {
      console.log('✅ Storage bucket: meeting-recordings EXISTS')
    } else {
      console.log('❌ Storage bucket: meeting-recordings NOT FOUND')
      allGood = false
    }
  } catch (error) {
    console.log('⚠️  Could not verify storage bucket')
    allGood = false
  }
  
  // Check recording_sessions columns
  try {
    const { data, error } = await supabase
      .from('recording_sessions')
      .select('project_id, chunks, upload_progress, storage_path')
      .limit(1)
    
    if (error && error.message.includes('does not exist')) {
      console.log('❌ recording_sessions table: Missing new columns')
      allGood = false
    } else {
      console.log('✅ recording_sessions table: Has required columns')
    }
  } catch (error) {
    console.log('⚠️  Could not verify recording_sessions table')
  }
  
  // Check meeting_tasks table
  try {
    const { data, error } = await supabase
      .from('meeting_tasks')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.log('❌ meeting_tasks table: DOES NOT EXIST')
      allGood = false
    } else {
      console.log('✅ meeting_tasks table: EXISTS')
    }
  } catch (error) {
    console.log('⚠️  Could not verify meeting_tasks table')
  }
  
  return allGood
}

async function main() {
  try {
    // Step 1: Create storage bucket
    const bucketCreated = await createStorageBucket()
    
    // Step 2: Setup database schema
    const schemaUpdated = await setupDatabaseSchema()
    
    // Step 3: Verify everything
    const verified = await verifySetup()
    
    console.log('\n' + '='.repeat(70))
    console.log('📊 SETUP SUMMARY')
    console.log('='.repeat(70))
    
    if (verified && bucketCreated) {
      console.log('\n✅ SETUP COMPLETE! Everything is ready!')
      console.log('\nYou can now:')
      console.log('  1. Click the floating recording button')
      console.log('  2. Select a project')
      console.log('  3. Start recording')
      console.log('  4. Chunks will upload to Supabase every 10 seconds')
      console.log('  5. After processing, meeting will appear on /meetings page')
    } else {
      console.log('\n⚠️  MANUAL SETUP REQUIRED')
      console.log('\nPlease complete these steps:')
      
      if (!bucketCreated) {
        console.log('\n  1. Create Storage Bucket:')
        console.log('     - Go to: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/storage/buckets')
        console.log('     - Click "New bucket"')
        console.log('     - Name: meeting-recordings')
        console.log('     - Public: NO')
        console.log('     - File size: 500 MB')
        console.log('     - Click "Create"')
      }
      
      if (!schemaUpdated) {
        console.log('\n  2. Run SQL Script:')
        console.log('     - Go to: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/sql/new')
        console.log('     - Copy contents of: scripts/setup-storage-bucket.sql')
        console.log('     - Click "Run"')
      }
    }
    
    console.log('\n' + '='.repeat(70))
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })




