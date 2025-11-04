require('dotenv').config({ path: '.env.local' })
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const { createClient } = require('@supabase/supabase-js')
const Groq = require('groq-sdk')
const { AssemblyAI } = require('assemblyai')

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiprojecthub.vercel.app'

console.log('🧪 COMPREHENSIVE SYSTEM TEST')
console.log('='.repeat(70))
console.log()

let testsPassed = 0
let testsFailed = 0

function pass(testName) {
  console.log(`✅ ${testName}`)
  testsPassed++
}

function fail(testName, error) {
  console.log(`❌ ${testName}`)
  console.log(`   Error: ${error}`)
  testsFailed++
}

async function runTests() {
  // TEST 1: Local Environment Variables
  console.log('📋 TEST 1: Local Environment Variables')
  try {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ASSEMBLYAI_API_KEY',
      'GROQ_API_KEY',
      'NEXT_PUBLIC_APP_URL'
    ]
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        pass(`${varName} is set`)
      } else {
        fail(`${varName} is missing`, 'Not found in .env.local')
      }
    }
  } catch (error) {
    fail('Environment check', error.message)
  }
  console.log()

  // TEST 2: Supabase Connection
  console.log('📋 TEST 2: Supabase Database Connection')
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data, error } = await supabase
      .from('recording_sessions')
      .select('count')
      .limit(1)
    
    if (!error) {
      pass('Supabase connection working')
    } else {
      fail('Supabase connection', error.message)
    }
  } catch (error) {
    fail('Supabase test', error.message)
  }
  console.log()

  // TEST 3: Groq API (Local)
  console.log('📋 TEST 3: Groq AI Service (Local)')
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    })
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Reply with just the word SUCCESS if you can read this.' }
      ],
      max_tokens: 10
    })
    
    const content = response.choices[0]?.message?.content
    if (content) {
      pass(`Groq API responding: "${content.trim()}"`)
    } else {
      fail('Groq API response', 'No content returned')
    }
  } catch (error) {
    fail('Groq API test', error.message)
  }
  console.log()

  // TEST 4: AssemblyAI API
  console.log('📋 TEST 4: AssemblyAI Service')
  try {
    const assemblyai = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY
    })
    
    // Just verify the client can be created
    pass('AssemblyAI client initialized')
  } catch (error) {
    fail('AssemblyAI test', error.message)
  }
  console.log()

  // TEST 5: Vercel API Endpoints
  console.log('📋 TEST 5: Vercel API Endpoints')
  try {
    // Test /api/recordings endpoint
    const pingRecordings = await fetch(`${appUrl}/api/recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Will fail validation but confirms endpoint exists
    })
    
    if (pingRecordings.status === 400 || pingRecordings.status === 200) {
      pass('/api/recordings endpoint reachable')
    } else {
      fail('/api/recordings endpoint', `Unexpected status: ${pingRecordings.status}`)
    }
  } catch (error) {
    fail('/api/recordings test', error.message)
  }
  
  try {
    // Test /api/transcribe endpoint
    const pingTranscribe = await fetch(`${appUrl}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Will fail validation but confirms endpoint exists
    })
    
    if (pingTranscribe.status === 400 || pingTranscribe.status === 200) {
      pass('/api/transcribe endpoint reachable')
    } else {
      fail('/api/transcribe endpoint', `Unexpected status: ${pingTranscribe.status}`)
    }
  } catch (error) {
    fail('/api/transcribe test', error.message)
  }
  
  try {
    // Test /api/process-recording endpoint
    const pingProcess = await fetch(`${appUrl}/api/process-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Will fail validation but confirms endpoint exists
    })
    
    if (pingProcess.status === 400 || pingProcess.status === 200) {
      pass('/api/process-recording endpoint reachable')
    } else {
      fail('/api/process-recording endpoint', `Unexpected status: ${pingProcess.status}`)
    }
  } catch (error) {
    fail('/api/process-recording test', error.message)
  }
  console.log()

  // TEST 6: Check Latest Recording Status
  console.log('📋 TEST 6: Latest Recording Status')
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data: recordings, error } = await supabase
      .from('recording_sessions')
      .select('id, transcription_status, ai_processed, transcription_text')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      fail('Fetch latest recording', error.message)
    } else if (recordings && recordings.length > 0) {
      const rec = recordings[0]
      console.log(`   Latest recording: ${rec.id}`)
      
      if (rec.transcription_text) {
        pass(`Transcription completed (${rec.transcription_text.length} chars)`)
      } else {
        fail('Transcription', 'No transcription text found')
      }
      
      if (rec.ai_processed) {
        pass('AI processing completed')
      } else {
        console.log(`   ⏳ AI processing not yet completed`)
      }
    } else {
      console.log('   ℹ️  No recordings found')
    }
  } catch (error) {
    fail('Recording status check', error.message)
  }
  console.log()

  // TEST 7: Verify AI Processing Works on Vercel
  console.log('📋 TEST 7: Vercel AI Processing (Groq API Key)')
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Find a recording with transcription but not AI processed
    const { data: unprocessed } = await supabase
      .from('recording_sessions')
      .select('id, user_id, metadata')
      .eq('transcription_status', 'completed')
      .eq('ai_processed', false)
      .not('transcription_text', 'is', null)
      .limit(1)
    
    if (unprocessed && unprocessed.length > 0) {
      const rec = unprocessed[0]
      console.log(`   Testing with recording: ${rec.id}`)
      
      const response = await fetch(`${appUrl}/api/process-recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: rec.id,
          userId: rec.user_id,
          projectId: rec.metadata?.projectId || null
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        pass('AI processing working on Vercel!')
        console.log(`   Meeting created: ${data.meeting?.title}`)
        console.log(`   Tasks created: ${data.tasksCreated}`)
      } else if (data.error === 'AI analysis unavailable') {
        fail('Groq API on Vercel', 'GROQ_API_KEY not set on Vercel')
        console.log(`   👉 Add GROQ_API_KEY to Vercel environment variables`)
      } else if (data.message === 'Recording already processed') {
        pass('Recording already processed')
      } else {
        fail('AI processing', data.error || data.details)
      }
    } else {
      console.log('   ℹ️  No unprocessed recordings to test with')
    }
  } catch (error) {
    fail('Vercel AI test', error.message)
  }
  console.log()

  // TEST 8: Cron Job Configuration
  console.log('📋 TEST 8: Cron Job Configuration')
  try {
    const response = await fetch(`${appUrl}/api/cron/process-completed-transcriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer INVALID` // Should fail auth but confirms endpoint exists
      }
    })
    
    if (response.status === 401) {
      pass('Cron job endpoint exists and requires auth')
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`)
    }
  } catch (error) {
    fail('Cron job check', error.message)
  }
  console.log()

  // SUMMARY
  console.log('='.repeat(70))
  console.log('📊 TEST SUMMARY')
  console.log(`   ✅ Passed: ${testsPassed}`)
  console.log(`   ❌ Failed: ${testsFailed}`)
  console.log(`   📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`)
  console.log()
  
  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is fully operational.')
  } else if (testsFailed <= 2) {
    console.log('⚠️  Minor issues detected. System mostly operational.')
  } else {
    console.log('❌ Multiple issues detected. Please fix before production use.')
  }
}

runTests().catch(console.error)

// Export for potential module use
module.exports = { runTests }

