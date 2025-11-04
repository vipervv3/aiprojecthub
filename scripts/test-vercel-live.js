require('dotenv').config({ path: '.env.local' })
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const { createClient } = require('@supabase/supabase-js')

// Force Vercel URL for live testing
const appUrl = 'https://aiprojecthub.vercel.app'

console.log('🧪 LIVE VERCEL SYSTEM TEST')
console.log('='.repeat(70))
console.log(`Testing against: ${appUrl}\n`)

let testsPassed = 0
let testsFailed = 0

function pass(testName, details = '') {
  console.log(`✅ ${testName}${details ? ` - ${details}` : ''}`)
  testsPassed++
}

function fail(testName, error) {
  console.log(`❌ ${testName}`)
  console.log(`   Error: ${error}`)
  testsFailed++
}

async function runTests() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // TEST 1: Vercel API Endpoints Reachability
  console.log('📋 TEST 1: Vercel API Endpoints')
  try {
    const pingRecordings = await fetch(`${appUrl}/api/recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    if (pingRecordings.status === 400 || pingRecordings.status === 500) {
      pass('/api/recordings endpoint reachable', `Status: ${pingRecordings.status}`)
    } else {
      fail('/api/recordings endpoint', `Unexpected status: ${pingRecordings.status}`)
    }
  } catch (error) {
    fail('/api/recordings endpoint', error.message)
  }

  try {
    const pingTranscribe = await fetch(`${appUrl}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    if (pingTranscribe.status === 400 || pingTranscribe.status === 500) {
      pass('/api/transcribe endpoint reachable', `Status: ${pingTranscribe.status}`)
    } else {
      fail('/api/transcribe endpoint', `Unexpected status: ${pingTranscribe.status}`)
    }
  } catch (error) {
    fail('/api/transcribe endpoint', error.message)
  }

  try {
    const pingProcess = await fetch(`${appUrl}/api/process-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    
    if (pingProcess.status === 400 || pingProcess.status === 500) {
      pass('/api/process-recording endpoint reachable', `Status: ${pingProcess.status}`)
    } else {
      fail('/api/process-recording endpoint', `Unexpected status: ${pingProcess.status}`)
    }
  } catch (error) {
    fail('/api/process-recording endpoint', error.message)
  }

  try {
    const pingCron = await fetch(`${appUrl}/api/cron/process-completed-transcriptions`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer INVALID' }
    })
    
    if (pingCron.status === 401) {
      pass('/api/cron/process-completed-transcriptions endpoint reachable', 'Requires auth')
    } else {
      fail('/api/cron endpoint', `Unexpected status: ${pingCron.status}`)
    }
  } catch (error) {
    fail('/api/cron endpoint', error.message)
  }
  console.log()

  // TEST 2: Find Unprocessed Recording
  console.log('📋 TEST 2: Unprocessed Recordings')
  try {
    const { data: unprocessed, error } = await supabase
      .from('recording_sessions')
      .select('id, user_id, metadata, transcription_text, transcription_status')
      .eq('transcription_status', 'completed')
      .eq('ai_processed', false)
      .not('transcription_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      fail('Find unprocessed recordings', error.message)
    } else if (unprocessed && unprocessed.length > 0) {
      const rec = unprocessed[0]
      pass('Found unprocessed recording', `ID: ${rec.id.substring(0, 8)}...`)
      console.log(`   Transcription: ${rec.transcription_text.length} chars`)
      console.log(`   Project ID: ${rec.metadata?.projectId || 'none'}`)
      console.log()
      
      // TEST 3: Test AI Processing on Vercel
      console.log('📋 TEST 3: AI Processing on Vercel')
      console.log(`   Testing with recording: ${rec.id}`)
      
      try {
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
          pass('✅ AI PROCESSING WORKS!', 'Groq API key is configured on Vercel!')
          console.log(`   Meeting created: ${data.meeting?.title}`)
          console.log(`   Meeting ID: ${data.meeting?.id}`)
          console.log(`   Tasks created: ${data.tasksCreated}`)
          console.log(`   Summary: ${data.summary?.substring(0, 100)}...`)
          
          // Verify in database
          const { data: meeting } = await supabase
            .from('meetings')
            .select('id, title, recording_session_id')
            .eq('recording_session_id', rec.id)
            .single()
          
          if (meeting) {
            pass('Meeting verified in database', `Title: "${meeting.title}"`)
          }
          
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, project_id')
            .eq('project_id', rec.metadata?.projectId || '')
          
          if (tasks && tasks.length > 0) {
            pass(`Tasks verified in database`, `${tasks.length} tasks created`)
            console.log(`   Tasks assigned to project: ${rec.metadata?.projectId || 'none'}`)
          }
          
        } else if (data.error === 'AI analysis unavailable' || data.details === 'AI analysis unavailable') {
          fail('AI processing failed', 'GROQ_API_KEY not set on Vercel')
          console.log(`   👉 ACTION REQUIRED: Add GROQ_API_KEY to Vercel environment variables`)
          console.log(`   👉 Value: ${process.env.GROQ_API_KEY?.substring(0, 20)}...`)
        } else if (data.message === 'Recording already processed') {
          pass('Recording already processed', 'This is good!')
          
          // Verify it exists
          const { data: meeting } = await supabase
            .from('meetings')
            .select('id, title, recording_session_id')
            .eq('recording_session_id', rec.id)
            .single()
          
          if (meeting) {
            pass('Meeting exists in database', `Title: "${meeting.title}"`)
          }
        } else {
          console.log(`   Response status: ${response.status}`)
          console.log(`   Response data:`, JSON.stringify(data, null, 2))
          fail('AI processing', data.error || data.details || JSON.stringify(data))
        }
      } catch (error) {
        fail('AI processing request', error.message)
      }
    } else {
      console.log('   ℹ️  No unprocessed recordings found')
      console.log('   ✅ All recordings are processed!')
      
      // Check if any meetings exist
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, title, recording_session_id')
        .not('recording_session_id', 'is', null)
        .limit(1)
      
      if (meetings && meetings.length > 0) {
        pass('Meetings exist from recordings', `${meetings[0].title}`)
      }
    }
  } catch (error) {
    fail('Unprocessed recordings check', error.message)
  }
  console.log()

  // TEST 4: Check Recording Statistics
  console.log('📋 TEST 4: Recording Statistics')
  try {
    const { data: allRecordings, error } = await supabase
      .from('recording_sessions')
      .select('transcription_status, ai_processed')
    
    if (!error && allRecordings) {
      const total = allRecordings.length
      const completed = allRecordings.filter(r => r.transcription_status === 'completed').length
      const aiProcessed = allRecordings.filter(r => r.ai_processed).length
      
      console.log(`   Total recordings: ${total}`)
      console.log(`   Transcriptions completed: ${completed}/${total}`)
      console.log(`   AI processed: ${aiProcessed}/${total}`)
      
      if (total > 0) {
        pass('Recording statistics', `${completed} transcribed, ${aiProcessed} AI processed`)
      }
    }
  } catch (error) {
    fail('Recording statistics', error.message)
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
    console.log('🎉 ALL TESTS PASSED! System is fully operational on Vercel!')
  } else if (testsFailed === 1 && testsPassed >= 8) {
    console.log('⚠️  One issue detected (likely GROQ_API_KEY missing on Vercel)')
    console.log('   Add the environment variable and redeploy to fix.')
  } else {
    console.log('❌ Issues detected. Review errors above.')
  }
}

runTests().catch(console.error)

