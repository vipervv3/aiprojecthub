/**
 * Comprehensive Supabase Setup Verification
 * Checks database, storage, and all required configurations
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyDatabase() {
  console.log('\n📊 Verifying Database...')
  
  // Check required tables
  const requiredTables = [
    'users',
    'projects',
    'tasks',
    'recording_sessions',
    'meetings',
    'meeting_tasks',
    'ai_insights',
    'notifications'
  ]
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`   ❌ Table "${table}": ${error.message}`)
      } else {
        console.log(`   ✅ Table "${table}": OK`)
      }
    } catch (err) {
      console.error(`   ❌ Table "${table}": ${err.message}`)
    }
  }
}

async function verifyStorage() {
  console.log('\n📦 Verifying Storage...')
  
  try {
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error(`   ❌ Error listing buckets: ${bucketsError.message}`)
      return
    }
    
    console.log(`   ✅ Found ${buckets.length} bucket(s)`)
    
    // Check meeting-recordings bucket
    const meetingBucket = buckets.find(b => b.name === 'meeting-recordings')
    
    if (!meetingBucket) {
      console.error('   ❌ Bucket "meeting-recordings" NOT FOUND!')
      console.log('   ⚠️  You need to create this bucket in Supabase Dashboard')
      return
    }
    
    console.log(`   ✅ Bucket "meeting-recordings" exists`)
    console.log(`      - ID: ${meetingBucket.id}`)
    console.log(`      - Public: ${meetingBucket.public ? '✅ YES' : '❌ NO - MUST BE PUBLIC!'}`)
    console.log(`      - Created: ${meetingBucket.created_at}`)
    
    if (!meetingBucket.public) {
      console.error('\n   🚨 CRITICAL: Bucket is NOT public!')
      console.error('   AssemblyAI cannot access recording files if bucket is private.')
      console.error('   Fix: Go to Supabase Dashboard → Storage → meeting-recordings → Make Public')
    }
    
    // Test file listing
    const { data: files, error: filesError } = await supabase.storage
      .from('meeting-recordings')
      .list()
    
    if (filesError) {
      console.error(`   ❌ Error listing files: ${filesError.message}`)
    } else {
      console.log(`   ✅ Can list files: ${files?.length || 0} file(s) found`)
    }
    
  } catch (error) {
    console.error(`   ❌ Storage verification error: ${error.message}`)
  }
}

async function verifyRecordingSessions() {
  console.log('\n🎙️ Verifying Recording Sessions...')
  
  try {
    const { data: sessions, error } = await supabase
      .from('recording_sessions')
      .select('id, title, transcription_status, ai_processed, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error(`   ❌ Error loading sessions: ${error.message}`)
      return
    }
    
    console.log(`   ✅ Found ${sessions?.length || 0} recording session(s)`)
    
    if (sessions && sessions.length > 0) {
      console.log('\n   Recent recordings:')
      sessions.forEach((session, idx) => {
        console.log(`   ${idx + 1}. ${session.title || 'Untitled'}`)
        console.log(`      - Status: ${session.transcription_status || 'pending'}`)
        console.log(`      - AI Processed: ${session.ai_processed ? '✅' : '❌'}`)
        console.log(`      - Created: ${new Date(session.created_at).toLocaleString()}`)
      })
      
      // Check for stuck transcriptions
      const stuckTranscriptions = sessions.filter(s => 
        (s.transcription_status === 'pending' || s.transcription_status === 'processing') &&
        new Date(s.created_at) < new Date(Date.now() - 5 * 60 * 1000) // Older than 5 minutes
      )
      
      if (stuckTranscriptions.length > 0) {
        console.log(`\n   ⚠️  Found ${stuckTranscriptions.length} recording(s) stuck in transcription (older than 5 minutes)`)
      }
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
  }
}

async function verifyMeetings() {
  console.log('\n📅 Verifying Meetings...')
  
  try {
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('id, title, recording_session_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error(`   ❌ Error loading meetings: ${error.message}`)
      return
    }
    
    console.log(`   ✅ Found ${meetings?.length || 0} meeting(s)`)
    
    if (meetings && meetings.length > 0) {
      console.log('\n   Recent meetings:')
      meetings.forEach((meeting, idx) => {
        console.log(`   ${idx + 1}. ${meeting.title}`)
        console.log(`      - Recording Session: ${meeting.recording_session_id || 'None'}`)
        console.log(`      - Created: ${new Date(meeting.created_at).toLocaleString()}`)
      })
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
  }
}

async function verifyOrphanedRecordings() {
  console.log('\n🔍 Checking for Orphaned Recordings...')
  
  try {
    // Find recordings with transcriptions but no meetings
    const { data: orphaned, error } = await supabase
      .from('recording_sessions')
      .select(`
        id,
        title,
        transcription_status,
        transcription_text,
        ai_processed,
        created_at
      `)
      .eq('transcription_status', 'completed')
      .not('transcription_text', 'is', null)
      .eq('ai_processed', false)
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      return
    }
    
    if (orphaned && orphaned.length > 0) {
      console.log(`   ⚠️  Found ${orphaned.length} orphaned recording(s) ready for processing:`)
      orphaned.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. ${rec.title || 'Untitled'} (${rec.id.substring(0, 8)}...)`)
        console.log(`      - Transcription: ✅ Complete`)
        console.log(`      - AI Processed: ❌ Not processed`)
      })
    } else {
      console.log('   ✅ No orphaned recordings found')
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
  }
}

async function verifyEnvironmentVariables() {
  console.log('\n🔑 Verifying Environment Variables...')
  
  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? '***SET***' : null,
    'ASSEMBLYAI_API_KEY': process.env.ASSEMBLYAI_API_KEY ? '***SET***' : null,
    'GROQ_API_KEY': process.env.GROQ_API_KEY ? '***SET***' : null,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  }
  
  for (const [key, value] of Object.entries(required)) {
    if (value) {
      console.log(`   ✅ ${key}: ${key.includes('KEY') ? '***SET***' : value}`)
    } else {
      console.error(`   ❌ ${key}: NOT SET`)
    }
  }
}

async function main() {
  console.log('🔍 Supabase Setup Verification')
  console.log('='.repeat(50))
  console.log(`\n🔗 Connecting to: ${supabaseUrl}`)
  
  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error(`\n❌ Connection failed: ${error.message}`)
      process.exit(1)
    }
    
    console.log('✅ Connected to Supabase\n')
    
    await verifyEnvironmentVariables()
    await verifyDatabase()
    await verifyStorage()
    await verifyRecordingSessions()
    await verifyMeetings()
    await verifyOrphanedRecordings()
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Verification Complete!')
    console.log('\n📋 Summary:')
    console.log('   - Check the results above for any ❌ errors')
    console.log('   - Most critical: Storage bucket MUST be PUBLIC')
    console.log('   - If orphaned recordings found, use the SQL script to process them')
    console.log('\n')
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    process.exit(1)
  }
}

main()

