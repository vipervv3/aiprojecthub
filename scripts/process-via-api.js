import 'dotenv/config'
import fetch from 'node-fetch'

const recordingId = process.argv[2] || '3495e2b2-cba0-4a90-a15c-ee33797e37a0'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiprojecthub.vercel.app'

console.log(`🤖 Processing recording: ${recordingId}`)
console.log(`   Via: ${appUrl}/api/process-recording`)

try {
  const response = await fetch(`${appUrl}/api/process-recording`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId: recordingId,
      userId: '0d29164e-53f6-4a05-a070-e8cae3f7ec31',
      projectId: '8fe55ee4-1d25-4691-9d4f-45e130a5ab85'
    })
  })

  const data = await response.json()

  if (response.ok) {
    console.log(`\n✅ SUCCESS!`)
    console.log(`Meeting Title: ${data.meeting?.title}`)
    console.log(`Meeting ID: ${data.meeting?.id}`)
    console.log(`Tasks Created: ${data.tasksCreated}`)
    console.log(`Summary: ${data.summary}`)
    console.log(`\n🎉 Your recording has been fully processed!`)
    console.log(`   Refresh your Meetings page to see it.`)
  } else {
    console.error(`\n❌ FAILED!`)
    console.error(`Status: ${response.status}`)
    console.error(`Error: ${JSON.stringify(data, null, 2)}`)
  }
} catch (error) {
  console.error(`\n❌ Request failed:`, error.message)
}

