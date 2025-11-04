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

async function processAllRecordings() {
  console.log('🔍 Finding all recordings...\n')
  
  // Get all recordings
  const { data: recordings, error } = await supabase
    .from('recording_sessions')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching recordings:', error)
    return
  }
  
  console.log(`Found ${recordings.length} recordings\n`)
  console.log('='.repeat(70))
  
  for (const rec of recordings) {
    console.log(`\n📹 Processing: ${rec.id}`)
    console.log(`   Title: ${rec.title}`)
    console.log(`   Status: ${rec.transcription_status}`)
    console.log(`   AI Processed: ${rec.ai_processed}`)
    
    // Step 1: Check transcription
    if (rec.transcription_status === 'pending' || !rec.transcription_text) {
      console.log(`   ⏳ Transcription not completed`)
      
      // Check if there's a transcript ID in metadata
      const transcriptId = rec.metadata?.transcriptId || rec.assemblyai_job_id
      
      if (transcriptId) {
        console.log(`   🔍 Found transcript ID: ${transcriptId}`)
        
        try {
          const transcript = await assemblyai.transcripts.get(transcriptId)
          
          if (transcript.status === 'completed') {
            console.log(`   ✅ Transcript completed! Updating database...`)
            
            await supabase
              .from('recording_sessions')
              .update({
                transcription_status: 'completed',
                transcription_text: transcript.text,
                transcription_confidence: transcript.confidence
              })
              .eq('id', rec.id)
            
            console.log(`   ✅ Database updated`)
            
            // Now trigger AI processing
            await triggerAIProcessing(rec)
          } else if (transcript.status === 'processing' || transcript.status === 'queued') {
            console.log(`   ⏳ Transcript still ${transcript.status}...`)
          } else {
            console.log(`   ❌ Transcript status: ${transcript.status}`)
          }
        } catch (error) {
          console.log(`   ❌ Error checking transcript: ${error.message}`)
        }
      } else {
        console.log(`   ⚠️  No transcript ID found - transcription may not have started`)
        console.log(`   👉 You may need to manually trigger transcription`)
      }
    } else if (rec.transcription_status === 'completed' && !rec.ai_processed) {
      console.log(`   ✅ Transcription completed, triggering AI processing...`)
      await triggerAIProcessing(rec)
    } else if (rec.ai_processed) {
      console.log(`   ✅ Already processed`)
      
      // Verify meeting exists
      const { data: meeting } = await supabase
        .from('meetings')
        .select('id, title')
        .eq('recording_session_id', rec.id)
        .single()
      
      if (meeting) {
        console.log(`   ✅ Meeting exists: "${meeting.title}"`)
      } else {
        console.log(`   ⚠️  Marked as processed but no meeting found!`)
      }
    }
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ Processing complete!')
}

async function triggerAIProcessing(recording) {
  try {
    console.log(`   🤖 Triggering AI processing...`)
    
    const response = await fetch(`${appUrl}/api/process-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: recording.id,
        userId: recording.user_id,
        projectId: recording.metadata?.projectId || null
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`   ✅ AI processing successful!`)
      console.log(`      Meeting: "${data.meeting?.title}"`)
      console.log(`      Tasks: ${data.tasksCreated}`)
    } else if (data.error === 'AI analysis unavailable' || data.details === 'AI analysis unavailable') {
      console.log(`   ❌ GROQ_API_KEY not set on Vercel!`)
      console.log(`   👉 Add GROQ_API_KEY to Vercel environment variables`)
    } else {
      console.log(`   ❌ AI processing failed: ${data.error || data.details}`)
    }
  } catch (error) {
    console.log(`   ❌ Error triggering AI: ${error.message}`)
  }
}

processAllRecordings().catch(console.error)

