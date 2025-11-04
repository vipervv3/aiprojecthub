require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { AssemblyAI } = require('assemblyai')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
})

const recordingId = process.argv[2]
const transcriptId = process.argv[3]

if (!recordingId || !transcriptId) {
  console.error('Usage: node scripts/manually-update-and-process.js <recording-id> <transcript-id>')
  process.exit(1)
}

async function processRecording() {
  try {
    console.log(`🔄 Step 1: Fetching transcript from AssemblyAI...`)
    const transcript = await assemblyai.transcripts.get(transcriptId)
    
    if (transcript.status !== 'completed') {
      console.error(`❌ Transcript not completed yet: ${transcript.status}`)
      return
    }
    
    console.log(`✅ Transcript completed: ${transcript.text.length} chars`)
    
    console.log(`\n🔄 Step 2: Updating database...`)
    const { error: updateError } = await supabase
      .from('recording_sessions')
      .update({
        transcription_status: 'completed',
        transcription_text: transcript.text,
        transcription_confidence: transcript.confidence
      })
      .eq('id', recordingId)
    
    if (updateError) {
      console.error('❌ Database update failed:', updateError)
      return
    }
    
    console.log(`✅ Database updated`)
    
    console.log(`\n🔄 Step 3: Getting recording details...`)
    const { data: recording, error: fetchError } = await supabase
      .from('recording_sessions')
      .select('user_id, metadata')
      .eq('id', recordingId)
      .single()
    
    if (fetchError || !recording) {
      console.error('❌ Failed to fetch recording:', fetchError)
      return
    }
    
    const projectId = recording.metadata?.projectId || null
    console.log(`   User ID: ${recording.user_id}`)
    console.log(`   Project ID: ${projectId || 'none'}`)
    
    console.log(`\n🔄 Step 4: Triggering AI processing...`)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiprojecthub.vercel.app'
    
    const response = await fetch(`${appUrl}/api/process-recording`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: recordingId,
        userId: recording.user_id,
        projectId
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ AI processing complete!`)
      console.log(`   Meeting ID: ${data.meeting?.id}`)
      console.log(`   Meeting Title: ${data.meeting?.title}`)
      console.log(`   Tasks Created: ${data.tasksCreated}`)
      console.log(`\n🎉 SUCCESS! Recording fully processed.`)
    } else {
      console.error(`❌ AI processing failed:`, data)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

processRecording()

