require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const recordingId = 'c4179c2f-2c4a-4835-b539-45b05ea9604f'

async function manuallyTriggerTranscription() {
  console.log('🎙️ MANUALLY TRIGGERING TRANSCRIPTION\n')
  console.log('Recording ID:', recordingId)
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

  console.log('📹 Recording found:')
  console.log(`   File Path: ${recording.file_path}`)
  console.log(`   File Size: ${recording.file_size} bytes`)

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('meeting-recordings')
    .getPublicUrl(recording.file_path)

  const publicUrl = urlData.publicUrl
  console.log(`   Public URL: ${publicUrl}`)

  // Check if file exists
  console.log('\n📦 Checking if file exists in storage...')
  try {
    const response = await fetch(publicUrl, { method: 'HEAD' })
    if (response.ok) {
      console.log('   ✅ File exists and is accessible')
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`)
    } else {
      console.log(`   ❌ File not accessible: ${response.status} ${response.statusText}`)
      return
    }
  } catch (error) {
    console.log(`   ❌ Error checking file: ${error.message}`)
    return
  }

  // Trigger transcription
  console.log('\n🚀 Triggering transcription...')
  try {
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const transcribeUrl = `${apiUrl}/api/transcribe`
    
    console.log(`   API URL: ${transcribeUrl}`)
    
    const response = await fetch(transcribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordingUrl: publicUrl,
        sessionId: recordingId,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('   ✅ Transcription triggered successfully!')
      console.log(`   Transcript ID: ${data.transcriptId}`)
      console.log(`   Message: ${data.message}`)
      console.log('\n⏳ Background polling started. This will take 30-90 seconds.')
      console.log('   Check Vercel logs for polling progress.')
      console.log('\n   After completion, run:')
      console.log('   node scripts/check-specific-recording.js')
    } else {
      console.log(`   ❌ Failed to trigger transcription: ${response.status}`)
      console.log('   Error:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
    console.error(error)
  }

  console.log('\n' + '='.repeat(70) + '\n')
}

manuallyTriggerTranscription().catch(console.error)

