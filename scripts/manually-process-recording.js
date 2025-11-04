import 'dotenv/config'

const recordingId = process.argv[2]

if (!recordingId) {
  console.error('❌ Please provide a recording ID')
  console.log('Usage: node scripts/manually-process-recording.js <recording-id>')
  process.exit(1)
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiprojecthub.vercel.app'

console.log(`🚀 Manually triggering AI processing for recording: ${recordingId}`)
console.log(`   App URL: ${appUrl}`)

try {
  const response = await fetch(`${appUrl}/api/process-recording`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: recordingId,
      userId: '0d29164e-53f6-4a05-a070-e8cae3f7ec31',
      projectId: 'e23731b8-a924-480a-9d69-2a742fdb47ba'
    })
  })

  const data = await response.json()

  if (response.ok) {
    console.log('✅ SUCCESS!')
    console.log('Response:', JSON.stringify(data, null, 2))
  } else {
    console.error('❌ FAILED!')
    console.error('Status:', response.status)
    console.error('Error:', JSON.stringify(data, null, 2))
  }
} catch (error) {
  console.error('❌ REQUEST FAILED:', error.message)
}
