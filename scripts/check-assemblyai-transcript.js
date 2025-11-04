require('dotenv').config({ path: '.env.local' })
const { AssemblyAI } = require('assemblyai')

const transcriptId = process.argv[2]

if (!transcriptId) {
  console.error('Usage: node scripts/check-assemblyai-transcript.js <transcript-id>')
  process.exit(1)
}

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
})

async function checkTranscript() {
  try {
    console.log(`🔍 Checking AssemblyAI transcript: ${transcriptId}\n`)
    
    const transcript = await assemblyai.transcripts.get(transcriptId)
    
    console.log(`Status: ${transcript.status}`)
    console.log(`Text length: ${transcript.text?.length || 0} chars`)
    console.log(`Confidence: ${transcript.confidence || 'N/A'}`)
    console.log(`Error: ${transcript.error || 'None'}`)
    
    if (transcript.status === 'completed') {
      console.log(`\n✅ TRANSCRIPTION COMPLETED!`)
      console.log(`\nTranscript text preview:`)
      console.log(transcript.text?.substring(0, 300) + '...')
    } else if (transcript.status === 'processing' || transcript.status === 'queued') {
      console.log(`\n⏳ Still processing...`)
    } else {
      console.log(`\n❌ Status: ${transcript.status}`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkTranscript()

