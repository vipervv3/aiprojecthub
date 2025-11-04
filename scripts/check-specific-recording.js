require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const recordingId = process.argv[2] || 'ee761c69-6a2c-4b74-9a7d-349e6d5caa52'

async function checkSpecificRecording() {
  console.log('🔍 INVESTIGATING RECORDING:', recordingId)
  console.log('='.repeat(70) + '\n')

  // Get the recording
  const { data: recording, error } = await supabase
    .from('recording_sessions')
    .select('*')
    .eq('id', recordingId)
    .single()

  if (error || !recording) {
    console.error('❌ Recording not found:', error)
    return
  }

  console.log('📹 RECORDING DATA:')
  console.log(`   ID: ${recording.id}`)
  console.log(`   Title: ${recording.title}`)
  console.log(`   User ID: ${recording.user_id}`)
  console.log(`   Created: ${new Date(recording.created_at).toLocaleString()}`)
  console.log(`   File Path: ${recording.file_path}`)
  console.log(`   File Size: ${recording.file_size} bytes`)
  console.log(`   Duration: ${recording.duration} seconds`)
  console.log(`   Transcription Status: ${recording.transcription_status}`)
  console.log(`   AI Processed: ${recording.ai_processed}`)
  console.log(`   AssemblyAI Job ID: ${recording.assemblyai_job_id || 'None'}`)
  console.log(`   Has Transcription: ${recording.transcription_text ? 'YES (' + recording.transcription_text.length + ' chars)' : 'NO'}`)
  console.log(`   Processing Error: ${recording.processing_error || 'None'}`)
  console.log(`   Metadata:`, JSON.stringify(recording.metadata, null, 2))

  // Check if meeting exists
  console.log('\n📅 CHECKING FOR MEETING:')
  const { data: meetings, error: meetError } = await supabase
    .from('meetings')
    .select('*')
    .eq('recording_session_id', recordingId)

  if (meetError) {
    console.log(`   ❌ Error: ${meetError.message}`)
  } else if (!meetings || meetings.length === 0) {
    console.log('   ❌ NO MEETING FOUND!')
    console.log('   This means AI processing never completed.')
  } else {
    const meeting = meetings[0]
    console.log(`   ✅ Meeting ID: ${meeting.id}`)
    console.log(`   Title: ${meeting.title}`)
    console.log(`   Summary: ${meeting.summary || 'None'}`)
    console.log(`   Action Items: ${meeting.action_items?.length || 0}`)
    console.log(`   Key Points: ${meeting.key_points?.length || 0}`)
  }

  // Check for tasks
  console.log('\n✅ CHECKING FOR TASKS:')
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_ai_generated', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const recordingTasks = allTasks?.filter(t => 
    t.tags && Array.isArray(t.tags) && t.tags.some(tag => tag.includes(recordingId))
  ) || []

  if (recordingTasks.length === 0) {
    console.log('   ❌ NO TASKS FOUND!')
  } else {
    console.log(`   ✅ Found ${recordingTasks.length} tasks`)
    recordingTasks.forEach(t => {
      console.log(`      - ${t.title} (Project: ${t.project_id || 'None'})`)
    })
  }

  // Diagnosis
  console.log('\n' + '='.repeat(70))
  console.log('🔎 DIAGNOSIS:\n')

  if (!recording.file_path || recording.file_path === 'undefined') {
    console.log('❌ PROBLEM: File path is missing or undefined!')
    console.log('   → Recording upload failed')
  } else if (recording.file_size === null || recording.file_size === 0) {
    console.log('❌ PROBLEM: File size is null or 0!')
    console.log('   → Recording upload failed or incomplete')
  } else if (recording.transcription_status === 'pending') {
    console.log('❌ PROBLEM: Transcription is still PENDING!')
    console.log('   → Background polling never started OR')
    console.log('   → AssemblyAI transcription never completed OR')
    console.log('   → Background polling failed')
    console.log('\n   NEXT STEPS:')
    console.log('   1. Check if file exists in Supabase Storage')
    console.log('   2. Manually trigger transcription')
    console.log('   3. Check Vercel logs for polling errors')
  } else if (recording.transcription_status === 'processing') {
    console.log('⏳ STATUS: Transcription is still PROCESSING')
    console.log('   → Wait for completion (can take 30-90 seconds)')
  } else if (recording.transcription_status === 'completed' && !recording.transcription_text) {
    console.log('❌ PROBLEM: Status is completed but NO transcription text!')
    console.log('   → Data inconsistency')
  } else if (recording.transcription_status === 'completed' && recording.transcription_text) {
    console.log('✅ Transcription completed')
    if (!recording.ai_processed) {
      console.log('❌ BUT AI processing NOT triggered!')
      console.log('   → /api/process-recording was never called OR')
      console.log('   → /api/process-recording failed')
    } else if (!meetings || meetings.length === 0) {
      console.log('❌ BUT NO meeting created!')
      console.log('   → /api/process-recording failed to create meeting')
    } else if (recordingTasks.length === 0) {
      console.log('❌ BUT NO tasks created!')
      console.log('   → Task extraction failed')
    }
  } else if (recording.transcription_status === 'failed') {
    console.log('❌ PROBLEM: Transcription FAILED!')
    console.log(`   Error: ${recording.processing_error || 'Unknown'}`)
  }

  console.log('\n')
}

checkSpecificRecording().catch(console.error)
