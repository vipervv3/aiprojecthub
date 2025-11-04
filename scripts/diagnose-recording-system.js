#!/usr/bin/env node

/**
 * Comprehensive Recording System Diagnostic
 * Checks every step of the recording → task extraction pipeline
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

async function diagnoseSystem() {
  console.log('🔍 COMPREHENSIVE RECORDING SYSTEM DIAGNOSTIC\n')
  console.log('=' .repeat(70))
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // 1. Check Latest Recording
  console.log('\n1️⃣ CHECKING LATEST RECORDING...\n')
  
  const { data: latestRecording, error: recError } = await supabase
    .from('recording_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (recError || !latestRecording) {
    console.log('   ❌ No recordings found or error:', recError?.message)
    return
  }
  
  console.log(`   ✅ Latest Recording Found:`)
  console.log(`      ID: ${latestRecording.id}`)
  console.log(`      Title: "${latestRecording.title}"`)
  console.log(`      Created: ${latestRecording.created_at}`)
  console.log(`      User ID: ${latestRecording.user_id}`)
  console.log(`      Duration: ${latestRecording.duration}s`)
  console.log(`      File Path: ${latestRecording.file_path}`)
  console.log(`      Transcription Status: ${latestRecording.transcription_status}`)
  console.log(`      AI Processed: ${latestRecording.ai_processed}`)
  console.log(`      Metadata: ${JSON.stringify(latestRecording.metadata, null, 2)}`)
  
  const projectId = latestRecording.metadata?.projectId
  console.log(`      Project Context: ${projectId || 'NONE ⚠️'}`)
  
  // 2. Check Transcription
  console.log('\n2️⃣ CHECKING TRANSCRIPTION...\n')
  
  if (latestRecording.transcription_status === 'pending') {
    console.log('   ⏳ Transcription still pending (wait 1-3 minutes)')
    console.log('   💡 Check back in a few minutes')
    return
  } else if (latestRecording.transcription_status === 'processing') {
    console.log('   ⏳ Transcription in progress...')
    return
  } else if (latestRecording.transcription_status === 'failed') {
    console.log('   ❌ Transcription FAILED')
    console.log(`      Error: ${latestRecording.processing_error || 'Unknown'}`)
    console.log('   🔧 Check ASSEMBLYAI_API_KEY in environment variables')
    return
  } else if (latestRecording.transcription_status === 'completed') {
    console.log('   ✅ Transcription completed')
    console.log(`      Confidence: ${latestRecording.transcription_confidence || 'N/A'}`)
    console.log(`      Text Length: ${latestRecording.transcription_text?.length || 0} characters`)
    
    if (latestRecording.transcription_text) {
      const preview = latestRecording.transcription_text.substring(0, 200)
      console.log(`      Preview: "${preview}${latestRecording.transcription_text.length > 200 ? '...' : ''}"`)
    } else {
      console.log('   ❌ No transcription text found!')
    }
  }
  
  // 3. Check AI Processing
  console.log('\n3️⃣ CHECKING AI PROCESSING...\n')
  
  if (!latestRecording.ai_processed) {
    console.log('   ⚠️  Recording NOT processed by AI yet')
    
    if (latestRecording.transcription_status === 'completed') {
      console.log('   💡 Transcription is done but AI processing did not trigger')
      console.log('   🔧 Possible issues:')
      console.log('      - NEXT_PUBLIC_APP_URL not set correctly in Vercel')
      console.log('      - API route /api/process-recording not working')
      console.log('      - Check Vercel logs for errors')
      console.log('')
      console.log('   🔄 You can manually process this recording:')
      console.log(`      1. Go to Meetings page`)
      console.log(`      2. Look for "Unprocessed Recordings" section`)
      console.log(`      3. Click "Process with AI" button`)
    }
    
    return
  } else {
    console.log('   ✅ Recording processed by AI')
    console.log(`      Processed at: ${latestRecording.metadata?.processed_at || 'Unknown'}`)
    console.log(`      Tasks created: ${latestRecording.metadata?.tasks_created || 'Unknown'}`)
    console.log(`      Meeting ID: ${latestRecording.metadata?.meeting_id || 'Unknown'}`)
  }
  
  // 4. Check Meeting Created
  console.log('\n4️⃣ CHECKING MEETING RECORD...\n')
  
  const meetingId = latestRecording.metadata?.meeting_id
  
  if (!meetingId) {
    console.log('   ❌ No meeting ID found in metadata')
    console.log('   🔧 Meeting was not created - check processing logs')
    return
  }
  
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()
  
  if (meetingError || !meeting) {
    console.log('   ❌ Meeting not found:', meetingError?.message)
    return
  }
  
  console.log('   ✅ Meeting record found:')
  console.log(`      ID: ${meeting.id}`)
  console.log(`      Title: "${meeting.title}"`)
  console.log(`      Scheduled: ${meeting.scheduled_at}`)
  console.log(`      Duration: ${meeting.duration} min`)
  console.log(`      Summary: ${meeting.summary ? 'YES' : 'NO'}`)
  console.log(`      Action Items: ${meeting.action_items?.length || 0}`)
  
  if (meeting.summary) {
    const summaryPreview = meeting.summary.substring(0, 150)
    console.log(`      Summary Preview: "${summaryPreview}..."`)
  }
  
  if (meeting.action_items && meeting.action_items.length > 0) {
    console.log('      Action Items List:')
    meeting.action_items.forEach((item, i) => {
      console.log(`        ${i + 1}. ${item.title || item}`)
    })
  }
  
  // 5. Check Tasks Created
  console.log('\n5️⃣ CHECKING TASKS CREATED...\n')
  
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .contains('tags', [`meeting:${meetingId}`])
    .order('created_at', { ascending: false })
  
  if (tasksError) {
    console.log('   ❌ Error fetching tasks:', tasksError.message)
    return
  }
  
  if (!tasks || tasks.length === 0) {
    console.log('   ⚠️  NO TASKS FOUND!')
    console.log('   🔍 Possible reasons:')
    console.log('      1. AI did not extract any actionable tasks from transcript')
    console.log('      2. Task creation failed (check Vercel logs)')
    console.log('      3. GROQ_API_KEY not set or invalid')
    console.log('')
    console.log('   💡 Try recording again with clear action items:')
    console.log('      Example: "Create a task to review the API documentation by Friday"')
    return
  }
  
  console.log(`   ✅ Found ${tasks.length} task(s):`)
  tasks.forEach((task, i) => {
    console.log(`\n      Task ${i + 1}:`)
    console.log(`        Title: "${task.title}"`)
    console.log(`        Priority: ${task.priority}`)
    console.log(`        Status: ${task.status}`)
    console.log(`        Project ID: ${task.project_id || 'NONE ⚠️'}`)
    console.log(`        AI Generated: ${task.is_ai_generated}`)
    console.log(`        Due Date: ${task.due_date || 'Not set'}`)
    console.log(`        Estimated Hours: ${task.estimated_hours || 'Not set'}`)
    
    if (task.project_id) {
      console.log(`        ✅ Task is linked to project!`)
    } else {
      console.log(`        ⚠️  Task NOT linked to any project`)
      console.log(`        🔧 Was a project selected before recording?`)
    }
  })
  
  // 6. Verify Project Link
  console.log('\n6️⃣ VERIFYING PROJECT CONTEXT...\n')
  
  if (projectId) {
    console.log(`   ✅ Recording had project context: ${projectId}`)
    
    // Check if project exists
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single()
    
    if (projError || !project) {
      console.log(`   ❌ Project not found! (ID: ${projectId})`)
      console.log('   🔧 Project may have been deleted')
    } else {
      console.log(`   ✅ Project exists: "${project.name}"`)
      
      // Check if tasks were linked to this project
      const tasksWithProject = tasks.filter(t => t.project_id === projectId)
      const tasksWithoutProject = tasks.filter(t => !t.project_id)
      
      console.log(`   📊 Task Distribution:`)
      console.log(`      ✅ Linked to project: ${tasksWithProject.length}`)
      console.log(`      ⚠️  Not linked: ${tasksWithoutProject.length}`)
      
      if (tasksWithoutProject.length > 0) {
        console.log('')
        console.log('   ⚠️  PROBLEM: Tasks were NOT linked to project!')
        console.log('   🔧 Possible causes:')
        console.log('      1. projectId not passed to process-recording API')
        console.log('      2. Check Vercel logs for processing errors')
        console.log('      3. Database update may have failed')
      }
    }
  } else {
    console.log('   ⚠️  No project context found in recording metadata')
    console.log('   💡 Was a project selected before recording?')
    console.log('   🔧 Check if project selector is working on Meetings page')
  }
  
  // 7. Environment Check
  console.log('\n7️⃣ CHECKING ENVIRONMENT VARIABLES...\n')
  
  const envVars = {
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'GROQ_API_KEY': process.env.GROQ_API_KEY,
    'ASSEMBLYAI_API_KEY': process.env.ASSEMBLYAI_API_KEY
  }
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value && value.length > 10) {
      console.log(`   ✅ ${key}: Set (${value.substring(0, 20)}...)`)
    } else {
      console.log(`   ❌ ${key}: NOT SET or INVALID`)
    }
  }
  
  // 8. Summary
  console.log('\n' + '='.repeat(70))
  console.log('\n📊 DIAGNOSTIC SUMMARY\n')
  
  const issues = []
  const working = []
  
  // Check each component
  if (latestRecording) working.push('Recording upload')
  else issues.push('No recordings found')
  
  if (latestRecording.transcription_status === 'completed') {
    working.push('Transcription')
  } else if (latestRecording.transcription_status === 'failed') {
    issues.push('Transcription failed')
  }
  
  if (latestRecording.ai_processed) {
    working.push('AI processing')
  } else if (latestRecording.transcription_status === 'completed') {
    issues.push('AI processing not triggered')
  }
  
  if (meeting) working.push('Meeting creation')
  else if (latestRecording.ai_processed) issues.push('Meeting not created')
  
  if (tasks && tasks.length > 0) {
    working.push(`Task extraction (${tasks.length} tasks)`)
  } else if (latestRecording.ai_processed) {
    issues.push('No tasks extracted')
  }
  
  const tasksWithProject = tasks?.filter(t => t.project_id) || []
  if (projectId && tasksWithProject.length > 0) {
    working.push('Project linking')
  } else if (projectId && tasks && tasks.length > 0) {
    issues.push('Tasks not linked to project')
  }
  
  console.log('✅ WORKING:')
  working.forEach(item => console.log(`   - ${item}`))
  
  if (issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:')
    issues.forEach(item => console.log(`   - ${item}`))
  }
  
  console.log('\n' + '='.repeat(70))
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n')
  
  if (latestRecording.transcription_status === 'pending') {
    console.log('   ⏳ Wait 1-3 minutes for transcription to complete')
  } else if (!latestRecording.ai_processed && latestRecording.transcription_status === 'completed') {
    console.log('   🔄 Manually process the recording from Meetings page')
    console.log('   🔧 Check NEXT_PUBLIC_APP_URL in Vercel environment variables')
  } else if (tasks && tasks.length === 0) {
    console.log('   📝 Record with clear action items like:')
    console.log('      "Create a task to update the documentation by Friday"')
  } else if (projectId && tasksWithProject.length === 0) {
    console.log('   🔧 Check Vercel logs for project linking errors')
    console.log('   🔄 Try processing recording again with project selected')
  }
  
  console.log('\n' + '='.repeat(70) + '\n')
}

diagnoseSystem().catch(error => {
  console.error('\n❌ Diagnostic failed:', error)
  process.exit(1)
})

