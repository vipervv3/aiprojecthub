require('dotenv').config({ path: '.env.local' })
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const { createClient } = require('@supabase/supabase-js')

const appUrl = 'https://aiprojecthub.vercel.app'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugAIProcessing() {
  console.log('🔍 Debugging AI Processing on Vercel\n')
  console.log('='.repeat(70))
  
  // Find unprocessed recording
  const { data: recordings } = await supabase
    .from('recording_sessions')
    .select('id, user_id, metadata, transcription_text')
    .eq('transcription_status', 'completed')
    .eq('ai_processed', false)
    .not('transcription_text', 'is', null)
    .limit(1)
  
  if (!recordings || recordings.length === 0) {
    console.log('No unprocessed recordings found')
    return
  }
  
  const rec = recordings[0]
  console.log(`\n📹 Testing with recording: ${rec.id}`)
  console.log(`   Transcription length: ${rec.transcription_text.length} chars`)
  console.log(`   Project ID: ${rec.metadata?.projectId || 'none'}`)
  
  console.log(`\n🔄 Calling /api/process-recording...`)
  
  try {
    const response = await fetch(`${appUrl}/api/process-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: rec.id,
        userId: rec.user_id,
        projectId: rec.metadata?.projectId || null
      })
    })
    
    const data = await response.json()
    
    console.log(`\n📊 Response Details:`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Status Text: ${response.statusText}`)
    console.log(`   Full Response:`)
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log(`\n✅ SUCCESS!`)
      console.log(`   Meeting ID: ${data.meeting?.id}`)
      console.log(`   Meeting Title: ${data.meeting?.title}`)
      console.log(`   Tasks Created: ${data.tasksCreated}`)
    } else {
      console.log(`\n❌ FAILED`)
      
      // Check for specific error types
      if (data.error === 'AI analysis unavailable' || data.details === 'AI analysis unavailable') {
        console.log(`\n🔍 Error Analysis:`)
        console.log(`   This usually means one of:`)
        console.log(`   1. GROQ_API_KEY not set on Vercel`)
        console.log(`   2. GROQ_API_KEY is invalid/expired`)
        console.log(`   3. Groq API is down`)
        console.log(`   4. Model name is wrong`)
        
        // Check what the actual error details say
        if (data.details) {
          console.log(`\n   Actual error details: ${data.details}`)
        }
      } else if (data.error) {
        console.log(`\n   Error: ${data.error}`)
        if (data.details) {
          console.log(`   Details: ${data.details}`)
        }
      }
    }
  } catch (error) {
    console.error(`\n❌ Request failed:`, error.message)
    console.error(`   Stack:`, error.stack)
  }
}

debugAIProcessing().catch(console.error)

