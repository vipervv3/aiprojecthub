require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixStuckTranscription() {
  const sessionId = '7472927f-15c4-4e05-b1c6-4d0c44c15fd2'
  
  console.log('🔍 INVESTIGATING STUCK TRANSCRIPTION\n')
  console.log('=' .repeat(60))

  // Get the recording details
  const { data: session, error } = await supabase
    .from('recording_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    console.error('❌ Error fetching session:', error)
    return
  }

  console.log('📹 Recording Details:')
  console.log(`   Title: ${session.title}`)
  console.log(`   Created: ${new Date(session.created_at).toLocaleString()}`)
  console.log(`   File Path: ${session.file_path}`)
  console.log(`   File Size: ${session.file_size} bytes`)
  console.log(`   Duration: ${session.duration} seconds`)
  console.log(`   Transcription Status: ${session.transcription_status}`)
  console.log(`   Has Transcription: ${session.transcription ? 'YES' : 'NO'}`)
  console.log(`   AI Processed: ${session.ai_processed}`)
  console.log(`   AssemblyAI Job ID: ${session.assemblyai_job_id || 'None'}`)

  // Check if file exists in storage
  console.log('\n📦 Checking Storage:')
  const { data: fileExists, error: storageError } = await supabase.storage
    .from('meeting-recordings')
    .list(session.file_path.split('/').slice(0, -1).join('/'))

  if (storageError) {
    console.log(`   ❌ Error checking storage: ${storageError.message}`)
  } else {
    const fileName = session.file_path.split('/').pop()
    const found = fileExists?.find(f => f.name === fileName)
    console.log(`   ${found ? '✅' : '❌'} File ${found ? 'EXISTS' : 'NOT FOUND'} in storage`)
    if (found) {
      console.log(`      Size: ${found.metadata?.size || 'unknown'}`)
    }
  }

  // Check if transcription was ever triggered
  console.log('\n🤖 Transcription Analysis:')
  if (!session.assemblyai_job_id) {
    console.log('   ❌ No AssemblyAI job ID - transcription was NEVER triggered!')
    console.log('   This is the root cause.')
    console.log('\n💡 Solution: Trigger transcription manually')
    console.log(`   POST ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transcribe`)
    console.log(`   Body: { "sessionId": "${sessionId}" }`)
  } else {
    console.log(`   ✅ Job ID exists: ${session.assemblyai_job_id}`)
    console.log('   Transcription was triggered but may have failed or is still processing')
    
    // Check with AssemblyAI API
    console.log('\n📡 Checking AssemblyAI status...')
    try {
      const response = await fetch(
        `https://api.assemblyai.com/v2/transcript/${session.assemblyai_job_id}`,
        {
          headers: {
            authorization: process.env.ASSEMBLYAI_API_KEY,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   Status: ${data.status}`)
        console.log(`   Text length: ${data.text?.length || 0} chars`)
        if (data.error) {
          console.log(`   Error: ${data.error}`)
        }
        
        if (data.status === 'completed' && data.text) {
          console.log('\n✅ Transcription IS complete on AssemblyAI!')
          console.log('   But it was never saved to our database.')
          console.log('\n💾 Fixing by saving transcription...')
          
          const { error: updateError } = await supabase
            .from('recording_sessions')
            .update({
              transcription: data.text,
              transcription_status: 'completed',
              ai_processed: false, // Reset to allow processing
            })
            .eq('id', sessionId)
          
          if (updateError) {
            console.log(`   ❌ Error updating: ${updateError.message}`)
          } else {
            console.log('   ✅ Transcription saved!')
            console.log('\n🚀 Now triggering AI processing...')
            
            // Trigger AI processing
            const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/process-recording`
            const processResponse = await fetch(processUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                userId: session.user_id,
                projectId: session.metadata?.projectId || null
              })
            })
            
            if (processResponse.ok) {
              console.log('   ✅ AI processing triggered!')
            } else {
              const errorText = await processResponse.text()
              console.log(`   ❌ Failed to trigger processing: ${errorText}`)
            }
          }
        }
      } else {
        console.log(`   ❌ Failed to check AssemblyAI: ${response.statusText}`)
      }
    } catch (err) {
      console.log(`   ❌ Error checking AssemblyAI: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
}

fixStuckTranscription().catch(console.error)

