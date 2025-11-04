import 'dotenv/config'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiprojecthub.vercel.app'
const cronSecret = process.env.CRON_SECRET

console.log(`🚀 Triggering cron job to process completed transcriptions`)
console.log(`   App URL: ${appUrl}`)

try {
  const response = await fetch(`${appUrl}/api/cron/process-completed-transcriptions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
    },
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

