/**
 * Supabase Setup Verification Script
 * Uses CommonJS for compatibility
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyDatabase() {
  console.log('\n📊 Verifying Database Tables...')
  
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
  console.log('\n📦 Verifying Storage Bucket...')
  
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
      console.error('\n   ❌ Bucket "meeting-recordings" NOT FOUND!')
      console.error('   ⚠️  You need to create this bucket in Supabase Dashboard')
      console.error('   Steps:')
      console.error('   1. Go to Supabase Dashboard → Storage')
      console.error('   2. Click "New bucket"')
      console.error('   3. Name: meeting-recordings')
      console.error('   4. Make it PUBLIC (critical for AssemblyAI!)')
      return
    }
    
    console.log(`   ✅ Bucket "meeting-recordings" exists`)
    console.log(`      - ID: ${meetingBucket.id}`)
    console.log(`      - Public: ${meetingBucket.public ? '✅ YES' : '❌ NO - MUST BE PUBLIC!'}`)
    console.log(`      - Created: ${new Date(meetingBucket.created_at).toLocaleString()}`)
    
    if (!meetingBucket.public) {
      console.error('\n   🚨 CRITICAL ISSUE: Bucket is NOT public!')
      console.error('   AssemblyAI cannot access recording files if bucket is private.')
      console.error('   Fix: Go to Supabase Dashboard → Storage → meeting-recordings → Settings → Make Public')
      return false
    }
    
    // Test file listing
    const { data: files, error: filesError } = await supabase.storage
      .from('meeting-recordings')
      .list()
    
    if (filesError) {
      console.error(`   ❌ Error listing files: ${filesError.message}`)
    } else {
      console.log(`   ✅ Can list files: ${files?.length || 0} file(s) found`)
      
      if (files && files.length > 0) {
        console.log('\n   Sample files:')
        files.slice(0, 3).forEach((file, idx) => {
          console.log(`   ${idx + 1}. ${file.name}`)
          console.log(`      - Size: ${(file.metadata?.size / 1024 / 1024).toFixed(2)} MB`)
          console.log(`      - Created: ${new Date(file.created_at).toLocaleString()}`)
        })
      }
    }
    
    return true
  } catch (error) {
    console.error(`   ❌ Storage verification error: ${error.message}`)
    return false
  }
}

async function verifyRecordingSessions() {
  console.log('\n🎙️ Verifying Recording Sessions...')
  
  try {
    const { data: sessions, error } = await supabase
      .from('recording_sessions')
      .select('id, title, transcription_status, ai_processed, file_path, created_at')
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
        console.log(`      - ID: ${session.id.substring(0, 8)}...`)
        console.log(`      - Status: ${session.transcription_status || 'pending'}`)
        console.log(`      - AI Processed: ${session.ai_processed ? '✅' : '❌'}`)
        console.log(`      - File: ${session.file_path || 'N/A'}`)
        console.log(`      - Created: ${new Date(session.created_at).toLocaleString()}`)
      })
      
      // Check for stuck transcriptions
      const stuckTranscriptions = sessions.filter(s => {
        const isStuck = (s.transcription_status === 'pending' || s.transcription_status === 'processing')
        const isOld = new Date(s.created_at) < new Date(Date.now() - 5 * 60 * 1000)
        return isStuck && isOld
      })
      
      if (stuckTranscriptions.length > 0) {
        console.log(`\n   ⚠️  Found ${stuckTranscriptions.length} recording(s) stuck in transcription (older than 5 minutes)`)
        console.log('   These may need manual processing via /api/check-transcription')
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
      .select('id, title, recording_session_id, summary, created_at')
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
        console.log(`      - Summary: ${meeting.summary ? '✅ Yes' : '❌ No'}`)
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
        console.log(`      - Created: ${new Date(rec.created_at).toLocaleString()}`)
      })
      console.log('\n   💡 These will be auto-processed when you visit the Meetings page')
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
  
  let allSet = true
  for (const [key, value] of Object.entries(required)) {
    if (value) {
      console.log(`   ✅ ${key}: ${key.includes('KEY') ? '***SET***' : value}`)
    } else {
      console.error(`   ❌ ${key}: NOT SET`)
      allSet = false
    }
  }
  
  return allSet
}

async function testRecordingUrl() {
  console.log('\n🔗 Testing Recording URL Access...')
  
  try {
    // Get a recent recording session with file_path
    const { data: session, error } = await supabase
      .from('recording_sessions')
      .select('file_path')
      .not('file_path', 'is', null)
      .limit(1)
      .single()
    
    if (error || !session) {
      console.log('   ⚠️  No recordings with file_path found to test')
      return
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('meeting-recordings')
      .getPublicUrl(session.file_path)
    
    const publicUrl = urlData.publicUrl
    
    console.log(`   Testing URL: ${publicUrl.substring(0, 80)}...`)
    
    // Try to fetch the URL (this simulates what AssemblyAI would do)
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' })
      
      if (response.ok) {
        console.log('   ✅ URL is accessible (AssemblyAI can access it)')
        console.log(`   ✅ Content-Type: ${response.headers.get('content-type')}`)
        console.log(`   ✅ Content-Length: ${(parseInt(response.headers.get('content-length') || '0') / 1024 / 1024).toFixed(2)} MB`)
      } else {
        console.error(`   ❌ URL returned status ${response.status} - AssemblyAI cannot access this!`)
        console.error('   This means the bucket is likely private or RLS is blocking access')
      }
    } catch (fetchError) {
      console.error(`   ❌ Error accessing URL: ${fetchError.message}`)
      console.error('   AssemblyAI will not be able to access recordings with this setup')
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
  }
}

async function main() {
  console.log('🔍 Supabase Setup Verification')
  console.log('='.repeat(60))
  console.log(`\n🔗 Connecting to: ${supabaseUrl}`)
  
  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error(`\n❌ Connection failed: ${error.message}`)
      process.exit(1)
    }
    
    console.log('✅ Connected to Supabase successfully!\n')
    
    const envOk = await verifyEnvironmentVariables()
    await verifyDatabase()
    const storageOk = await verifyStorage()
    await verifyRecordingSessions()
    await verifyMeetings()
    await verifyOrphanedRecordings()
    
    if (storageOk) {
      await testRecordingUrl()
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Verification Complete!')
    console.log('\n📋 Summary:')
    console.log('   - Check the results above for any ❌ errors')
    console.log('   - Most critical: Storage bucket MUST be PUBLIC')
    console.log('   - Recording URLs must be accessible for AssemblyAI')
    console.log('   - If orphaned recordings found, they will auto-process')
    console.log('\n')
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()

