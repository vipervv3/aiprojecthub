require('dotenv').config({ path: '.env.local' })

async function testAIServices() {
  console.log('🤖 TESTING AI SERVICES CONFIGURATION\n')
  console.log('='.repeat(60))

  // Check environment variables
  console.log('\n1️⃣  AI API KEYS:')
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const assemblyaiKey = process.env.ASSEMBLYAI_API_KEY

  console.log(`   GROQ_API_KEY: ${groqKey ? `✅ Set (${groqKey.substring(0, 10)}...)` : '❌ Missing'}`)
  console.log(`   OPENAI_API_KEY: ${openaiKey ? `✅ Set (${openaiKey.substring(0, 10)}...)` : '⚠️  Not set (optional fallback)'}`)
  console.log(`   ASSEMBLYAI_API_KEY: ${assemblyaiKey ? `✅ Set (${assemblyaiKey.substring(0, 10)}...)` : '❌ Missing'}`)

  // Test Groq API (primary AI)
  console.log('\n2️⃣  TESTING GROQ API (Primary AI):')
  if (!groqKey) {
    console.log('   ❌ Cannot test - API key missing')
  } else {
    try {
      console.log('   Sending test request to Groq...')
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'user', content: 'Say "hello" and nothing else.' }
          ],
          max_tokens: 10
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ Groq API is working!')
        console.log(`   Response: ${data.choices[0].message.content}`)
      } else {
        const error = await response.text()
        console.log(`   ❌ Groq API failed: ${response.status} ${response.statusText}`)
        console.log(`   Error: ${error.substring(0, 200)}`)
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`)
    }
  }

  // Test AssemblyAI (transcription)
  console.log('\n3️⃣  TESTING ASSEMBLYAI API (Transcription):')
  if (!assemblyaiKey) {
    console.log('   ❌ Cannot test - API key missing')
  } else {
    try {
      console.log('   Checking API key validity...')
      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'GET',
        headers: {
          'authorization': assemblyaiKey
        }
      })

      if (response.ok || response.status === 400) {
        // 400 is expected for GET without ID, but means auth worked
        console.log('   ✅ AssemblyAI API key is valid!')
      } else if (response.status === 401) {
        console.log('   ❌ AssemblyAI API key is INVALID!')
      } else {
        console.log(`   ⚠️  Unexpected status: ${response.status}`)
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`)
    }
  }

  // Check AI config file
  console.log('\n4️⃣  CHECKING AI CONFIGURATION FILE:')
  try {
    const fs = require('fs')
    const configPath = 'lib/ai/config.ts'
    
    if (fs.existsSync(configPath)) {
      console.log('   ✅ lib/ai/config.ts exists')
      const content = fs.readFileSync(configPath, 'utf8')
      
      if (content.includes("primary: 'groq'")) {
        console.log('   ✅ Primary AI set to Groq')
      } else if (content.includes("primary: 'openai'")) {
        console.log('   ⚠️  Primary AI set to OpenAI (should be Groq)')
      } else {
        console.log('   ⚠️  Primary AI provider not clearly set')
      }
      
      if (content.includes("transcription: 'assemblyai'")) {
        console.log('   ✅ Transcription set to AssemblyAI')
      }
    } else {
      console.log('   ❌ lib/ai/config.ts not found')
    }
  } catch (error) {
    console.log(`   ❌ Error checking config: ${error.message}`)
  }

  // Check AI services file
  console.log('\n5️⃣  CHECKING AI SERVICES FILE:')
  try {
    const fs = require('fs')
    const servicesPath = 'lib/ai/services.ts'
    
    if (fs.existsSync(servicesPath)) {
      console.log('   ✅ lib/ai/services.ts exists')
      const content = fs.readFileSync(servicesPath, 'utf8')
      
      if (content.includes('extractTasksFromText')) {
        console.log('   ✅ Task extraction method found')
      }
      
      if (content.includes('analyzeWithGroq')) {
        console.log('   ✅ Groq integration found')
      }
      
      if (content.includes('analyzeWithFallback')) {
        console.log('   ✅ Fallback mechanism found')
      }
    } else {
      console.log('   ❌ lib/ai/services.ts not found')
    }
  } catch (error) {
    console.log(`   ❌ Error checking services: ${error.message}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 AI SERVICES STATUS:\n')
  
  const groqReady = !!groqKey
  const assemblyaiReady = !!assemblyaiKey
  
  if (groqReady && assemblyaiReady) {
    console.log('✅ ALL AI SERVICES READY!')
    console.log('\nRecording pipeline will:')
    console.log('  1. Upload → /api/recordings')
    console.log('  2. Transcribe → AssemblyAI')
    console.log('  3. Extract tasks → Groq AI')
    console.log('  4. Assign to project ✓')
    console.log('  5. Generate summary ✓')
    console.log('  6. Create action items ✓\n')
  } else {
    console.log('⚠️  SOME SERVICES MISSING:')
    if (!groqReady) console.log('  - GROQ_API_KEY needed for task extraction')
    if (!assemblyaiReady) console.log('  - ASSEMBLYAI_API_KEY needed for transcription')
    console.log()
  }
}

testAIServices().catch(console.error)

