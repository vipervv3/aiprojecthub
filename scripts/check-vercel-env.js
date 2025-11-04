require('dotenv').config({ path: '.env.local' })
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const appUrl = 'https://aiprojecthub.vercel.app'

async function checkEnv() {
  console.log('🔍 Checking Vercel Environment Variables\n')
  console.log(`URL: ${appUrl}/api/debug-env\n`)
  
  try {
    const response = await fetch(`${appUrl}/api/debug-env`)
    const data = await response.json()
    
    console.log('Environment Variables Status:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data.envVars?.GROQ_API_KEY === '✅ SET') {
      console.log('\n✅ GROQ_API_KEY is set on Vercel!')
      console.log(`   Length: ${data.envVars.GROQ_API_KEY_LENGTH} chars`)
      console.log(`   Prefix: ${data.envVars.GROQ_API_KEY_PREFIX}...`)
      console.log('\n⚠️  If AI still fails, the issue might be:')
      console.log('   1. Groq API key is invalid')
      console.log('   2. Groq API rate limit exceeded')
      console.log('   3. Model name issue')
      console.log('   4. Network/API connectivity issue')
    } else {
      console.log('\n❌ GROQ_API_KEY is NOT set on Vercel!')
      console.log('   👉 Add it to Vercel environment variables')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkEnv().catch(console.error)

