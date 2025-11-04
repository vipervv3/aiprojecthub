require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const recordingId = 'c4179c2f-2c4a-4835-b539-45b05ea9604f'

async function checkRecording() {
  console.log('🔍 CHECKING RECORDING: ' + recordingId)
  console.log('='.repeat(70))

  // Get recording
  const { data: recording, error } = await supabase
    .from('recording_sessions')
    .select('*')
    .eq('id', recordingId)
    .single()

  if (error) {
    console.log('\n❌ Error fetching recording:', error.message)
    return
  }

  console.log('\n📹 RECORDING DATA:')
  console.log(`   Title: ${recording.title}`)
  console.log(`   Created: ${recording.created_at}`)
  console.log(`   User ID: ${recording.user_id}`)
  console.log(`   File Path: ${recording.file_path}`)
  console.log(`   File Size: ${recording.file_size}`)
  console.log(`   Duration: ${recording.duration} seconds`)
  console.log(`   Transcription Status: ${recording.transcription_status}`)
  console.log(`   AI Processed: ${recording.ai_processed}`)
  console.log(`   AssemblyAI Job ID: ${recording.assemblyai_job_id || 'None'}`)
  console.log(`   Has Transcription Text: ${recording.transcription_text ? 'YES (' + recording.transcription_text.length + ' chars)' : 'NO'}`)
  console.log(`   Processing Error: ${recording.processing_error || 'None'}`)
  console.log(`   Metadata:`, JSON.stringify(recording.metadata, null, 2))

  console.log('\n' + '─'.repeat(70))

  // Check if meeting exists
  const { data: meetings, error: meetingError } = await supabase
    .from('meetings')
    .select('*')
    .eq('recording_session_id', recordingId)

  if (meetingError) {
    console.log('\n❌ Error checking meetings:', meetingError.message)
  } else if (!meetings || meetings.length === 0) {
    console.log('\n❌ NO MEETING CREATED!')
    console.log('   This means AI processing never ran or failed')
  } else {
    console.log('\n✅ MEETING FOUND:')
    const meeting = meetings[0]
    console.log(`   Meeting ID: ${meeting.id}`)
    console.log(`   Title: ${meeting.title}`)
    console.log(`   Summary: ${meeting.summary || 'None'}`)
    console.log(`   Action Items: ${meeting.action_items?.length || 0}`)
    
    // Check tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(50)

    const meetingTasks = tasks?.filter(t => 
      Array.isArray(t.tags) && t.tags.some(tag => tag.includes(meeting.id))
    ) || []

    console.log(`   Tasks Created: ${meetingTasks.length}`)
    if (meetingTasks.length > 0) {
      meetingTasks.forEach(t => {
        console.log(`      - ${t.title} (Project: ${t.project_id || 'None'})`)
      })
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n🔍 DIAGNOSIS:\n')

  if (recording.transcription_status === 'pending') {
    console.log('❌ PROBLEM: Transcription is still PENDING')
    console.log('   Reason: Background polling may have failed or not started')
    console.log('   Solution: Check Vercel logs for transcription polling errors')
    
    if (!recording.assemblyai_job_id) {
      console.log('\n❌ CRITICAL: No AssemblyAI job ID!')
      console.log('   The transcription was NEVER started')
      console.log('   Check /api/transcribe logs')
    }
  } else if (recording.transcription_status === 'completed' && !recording.transcription_text) {
    console.log('❌ PROBLEM: Status is "completed" but no transcription text!')
    console.log('   This is a data inconsistency')
  } else if (recording.transcription_text && !recording.ai_processed) {
    console.log('⚠️ PROBLEM: Has transcription but NOT processed')
    console.log('   AI processing failed or wasn\'t triggered')
    console.log('   Solution: Manually trigger processing')
  } else if (recording.ai_processed && (!meetings || meetings.length === 0)) {
    console.log('❌ PROBLEM: Marked as processed but NO meeting exists!')
    console.log('   This indicates /api/process-recording failed')
    console.log('   Check: ', recording.processing_error)
  }

  console.log('\n📊 NEXT STEPS:\n')
  
  if (recording.transcription_status === 'pending') {
    console.log('1. Check Vercel logs for transcription polling')
    console.log('2. Verify NEXT_PUBLIC_APP_URL is set correctly on Vercel')
    console.log('3. Check AssemblyAI API key is valid')
    console.log('4. Wait 2-3 more minutes and check again')
  } else if (recording.transcription_text && !meetings) {
    console.log('1. Manually trigger AI processing:')
    console.log(`   POST /api/process-recording`)
    console.log(`   Body: { sessionId: "${recordingId}", userId: "${recording.user_id}", projectId: "${recording.metadata?.projectId || 'null'}" }`)
  }

  console.log('\n')
}

checkRecording().catch(console.error)

