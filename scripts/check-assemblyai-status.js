require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const assemblyai = require('assemblyai')

const transcriptId = process.argv[2]

if (!transcriptId) {
  console.error('❌ Please provide a transcript ID')
  console.error('Usage: node scripts/check-assemblyai-status.js <transcript-id>')
  process.exit(1)
}

console.log(`🔍 Checking AssemblyAI transcript: ${transcriptId}\n`)

const client = new assemblyai.AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
})

async function checkStatus() {
  try {
    const transcript = await client.transcripts.get(transcriptId)
    
    console.log('📊 AssemblyAI Status:')
    console.log(`   Status: ${transcript.status}`)
    console.log(`   ID: ${transcript.id}`)
    
    if (transcript.status === 'completed') {
      console.log(`   ✅ Transcription completed!`)
      console.log(`   Text length: ${transcript.text?.length || 0} characters`)
      console.log(`   Confidence: ${transcript.confidence || 'N/A'}`)
      console.log(`\n📝 Text preview:`)
      console.log(`   "${transcript.text?.substring(0, 200)}..."`)
    } else if (transcript.status === 'error') {
      console.log(`   ❌ Transcription failed!`)
      console.log(`   Error: ${transcript.error}`)
    } else {
      console.log(`   ⏳ Still processing...`)
    }
    
  } catch (error) {
    console.error('❌ Error checking AssemblyAI:', error.message)
    process.exit(1)
  }
}

checkStatus()

