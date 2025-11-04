require('dotenv').config({ path: '.env.local' })
const Groq = require('groq-sdk')

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

async function testGroq() {
  console.log('🧪 Testing Groq API Locally\n')
  
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in .env.local')
    return
  }
  
  console.log(`✅ GROQ_API_KEY found (${process.env.GROQ_API_KEY.length} chars)`)
  console.log(`   Prefix: ${process.env.GROQ_API_KEY.substring(0, 10)}...`)
  console.log()
  
  try {
    console.log('🔄 Testing Groq API call...')
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Reply with just the word SUCCESS' }
      ],
      max_tokens: 10
    })
    
    const content = response.choices[0]?.message?.content
    console.log('✅ Groq API working!')
    console.log(`   Response: "${content}"`)
  } catch (error) {
    console.error('❌ Groq API failed!')
    console.error('   Error:', error.message)
    console.error('   Type:', error.constructor.name)
    
    if (error.response) {
      console.error('   Response status:', error.response.status)
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2))
    }
    
    if (error.message.includes('API key')) {
      console.error('\n🔍 DIAGNOSIS: API Key issue')
      console.error('   - Check if key is valid')
      console.error('   - Check if key has correct format')
    } else if (error.message.includes('model')) {
      console.error('\n🔍 DIAGNOSIS: Model issue')
      console.error('   - Model name might be incorrect')
    }
  }
}

testGroq().catch(console.error)

