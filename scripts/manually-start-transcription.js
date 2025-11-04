require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { AssemblyAI } = require('assemblyai')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
})

const appUrl = 'https://aiprojecthub.vercel.app'

const recordingId = process.argv[2]

if (!recordingId) {
  console.error('Usage: node scripts/manually-start-transcription.js <recording-id>')
  process.exit(1)
}

async function startTranscription() {
  console.log(`🎙️ Starting transcription for recording: ${recordingId}\n`)
  
  // Get recording
  const { data: recording, error } = await supabase
    .from('recording_sessions')
    .select('*')
    .eq('id', recordingId)
    .single()
  
  if (error || !recording) {
    console.error('❌ Recording not found:', error)
    return
  }
  
  console.log(`📹 Recording: ${recording.title}`)
  console.log(`   File: ${recording.file_path}`)
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('meeting-recordings')
    .getPublicUrl(recording.file_path)
  
  const publicUrl = urlData.publicUrl
  console.log(`   URL: ${publicUrl}`)
  
  // Start transcription via API
  console.log(`\n🔄 Starting transcription via API...`)
  
  try {
    const response = await fetch(`${appUrl}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordingUrl: publicUrl,
        sessionId: recordingId
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ Transcription started!`)
      console.log(`   Transcript ID: ${data.transcriptId}`)
      console.log(`   Message: ${data.message}`)
      console.log(`\n⏳ Transcription will complete in 30-60 seconds`)
      console.log(`   The cron job will automatically process it once complete.`)
    } else {
      console.error(`❌ Failed to start transcription:`)
      console.error(`   ${JSON.stringify(data, null, 2)}`)
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message)
  }
}

startTranscription().catch(console.error)

