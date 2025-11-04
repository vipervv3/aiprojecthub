require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugTaskExtraction() {
  console.log('🔍 DEBUGGING TASK EXTRACTION PIPELINE\n')
  console.log('=' .repeat(60))

  // 1. Get most recent recording
  const { data: recordings, error: recError } = await supabase
    .from('recording_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (recError) {
    console.error('❌ Error fetching recordings:', recError)
    return
  }

  if (!recordings || recordings.length === 0) {
    console.log('⚠️  No recordings found')
    return
  }

  console.log(`\n📊 Found ${recordings.length} recent recordings:\n`)

  for (const rec of recordings) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📹 Recording: ${rec.title}`)
    console.log(`   ID: ${rec.id}`)
    console.log(`   Created: ${new Date(rec.created_at).toLocaleString()}`)
    console.log(`   Transcription Status: ${rec.transcription_status}`)
    console.log(`   AI Processed: ${rec.ai_processed ? '✅ YES' : '❌ NO'}`)
    console.log(`   Has Transcription: ${rec.transcription ? '✅ YES' : '❌ NO'}`)
    console.log(`   Project ID in metadata: ${rec.metadata?.projectId || 'None'}`)

    // Check if there's a meeting created from this recording
    const { data: meetings, error: meetError } = await supabase
      .from('meetings')
      .select('*')
      .eq('recording_session_id', rec.id)

    if (meetError) {
      console.log(`   ❌ Error checking meetings: ${meetError.message}`)
    } else if (meetings && meetings.length > 0) {
      const meeting = meetings[0]
      console.log(`\n   📅 Meeting created:`)
      console.log(`      Meeting ID: ${meeting.id}`)
      console.log(`      Title: ${meeting.title}`)
      console.log(`      Summary: ${meeting.summary ? 'Yes' : 'No'}`)
      console.log(`      Key Points: ${meeting.key_points?.length || 0}`)
      console.log(`      Action Items: ${meeting.action_items?.length || 0}`)
      console.log(`      Decisions: ${meeting.decisions?.length || 0}`)

      if (meeting.action_items && meeting.action_items.length > 0) {
        console.log(`\n      📋 Action Items:`)
        meeting.action_items.forEach((item, i) => {
          console.log(`         ${i + 1}. ${typeof item === 'string' ? item : item.title || JSON.stringify(item)}`)
        })
      }

      // Check if tasks were created
      const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .contains('tags', [`meeting:${meeting.id}`])

      if (taskError) {
        console.log(`      ❌ Error checking tasks: ${taskError.message}`)
      } else if (tasks && tasks.length > 0) {
        console.log(`\n      ✅ ${tasks.length} Tasks extracted:`)
        tasks.forEach((task, i) => {
          console.log(`         ${i + 1}. [${task.priority}] ${task.title}`)
          console.log(`            Project: ${task.project_id || 'None'}`)
          console.log(`            Status: ${task.status}`)
          console.log(`            AI Generated: ${task.is_ai_generated ? 'Yes' : 'No'}`)
        })
      } else {
        console.log(`      ❌ NO TASKS CREATED!`)
        console.log(`      This is the problem - tasks should have been created from action items`)
      }
    } else {
      console.log(`   ❌ No meeting created from this recording`)
      console.log(`   This means AI processing hasn't run yet`)
    }

    // Check transcription content length
    if (rec.transcription) {
      const transcriptLength = rec.transcription.length
      console.log(`\n   📝 Transcription length: ${transcriptLength} characters`)
      if (transcriptLength < 50) {
        console.log(`   ⚠️  Warning: Transcription is very short, may not have enough content`)
      }
      console.log(`   First 200 chars: "${rec.transcription.substring(0, 200)}..."`)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('\n🔍 CHECKING AI CONFIGURATION:\n')

  // Check if AI keys are set
  console.log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`ASSEMBLYAI_API_KEY: ${process.env.ASSEMBLYAI_API_KEY ? '✅ Set' : '❌ Missing'}`)

  console.log(`\n${'='.repeat(60)}`)
  console.log('\n💡 RECOMMENDATIONS:\n')

  const latestRec = recordings[0]
  
  if (!latestRec.transcription) {
    console.log('1. ⚠️  Latest recording has no transcription')
    console.log('   → Run transcription first: POST /api/transcribe')
  } else if (!latestRec.ai_processed) {
    console.log('1. ⚠️  Latest recording has transcription but NOT processed')
    console.log('   → AI processing may have failed or not been triggered')
    console.log('   → Check server logs for errors in /api/process-recording')
  } else {
    console.log('1. ✅ Latest recording is transcribed and marked as processed')
    
    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('recording_session_id', latestRec.id)
      .single()
    
    if (meeting) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .contains('tags', [`meeting:${meeting.id}`])
      
      if (!tasks || tasks.length === 0) {
        console.log('   ⚠️  BUT no tasks were created!')
        console.log('   → This suggests task extraction is failing')
        console.log('   → Try manually triggering: POST /api/process-recording')
      }
    }
  }

  console.log('\n')
}

debugTaskExtraction().catch(console.error)

