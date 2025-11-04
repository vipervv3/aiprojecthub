require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addColumn() {
  try {
    console.log('\n🔧 Adding assemblyai_job_id column to recording_sessions table...\n')
    
    // We can't use SQL directly through the JS client for DDL operations
    // The user needs to run this SQL in their Supabase SQL Editor
    
    const sql = `
-- Add assemblyai_job_id column to recording_sessions table
ALTER TABLE recording_sessions 
ADD COLUMN IF NOT EXISTS assemblyai_job_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recording_sessions_assemblyai_job_id 
ON recording_sessions(assemblyai_job_id);
`
    
    console.log('⚠️  You need to run this SQL in your Supabase SQL Editor:\n')
    console.log('📋 Copy and paste the following SQL:\n')
    console.log('━'.repeat(70))
    console.log(sql)
    console.log('━'.repeat(70))
    console.log('\n📍 Go to: https://supabase.com/dashboard/project/xekyfsnxrnfkdvrcsiye/editor\n')
    console.log('Then run this script again after the SQL is executed.\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

addColumn()

