require('dotenv').config({ path: '.env.local' })
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const appUrl = 'https://aiprojecthub.vercel.app'
const recordingId = '9de22df8-be40-454a-9225-9b7b6ed9830d'

async function testAIProcessing() {
  console.log('🔍 Testing AI Processing Directly on Vercel\n')
  console.log(`Recording: ${recordingId}`)
  console.log(`URL: ${appUrl}/api/process-recording\n`)
  
  try {
    const response = await fetch(`${appUrl}/api/process-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: recordingId,
        userId: '0d29164e-53f6-4a05-a070-e8cae3f7ec31',
        projectId: '8fe55ee4-1d25-4691-9d4f-45e130a5ab85'
      })
    })
    
    const data = await response.json()
    
    console.log(`Status Code: ${response.status}`)
    console.log(`Response:`)
    console.log(JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n✅ SUCCESS!')
      console.log(`Meeting: ${data.meeting?.title}`)
      console.log(`Tasks: ${data.tasksCreated}`)
    } else {
      console.log('\n❌ FAILED')
      
      // Check for specific error patterns
      if (data.error === 'AI analysis unavailable' || data.details === 'AI analysis unavailable') {
        console.log('\n🔍 DIAGNOSIS: GROQ_API_KEY issue')
      } else if (data.error?.includes('model')) {
        console.log('\n🔍 DIAGNOSIS: Model configuration issue')
      } else if (data.error?.includes('timeout')) {
        console.log('\n🔍 DIAGNOSIS: Timeout issue')
      } else {
        console.log('\n🔍 DIAGNOSIS: Unknown error')
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

testAIProcessing().catch(console.error)

