require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyRecordingReady() {
  console.log('🔍 VERIFYING RECORDING SYSTEM IS READY TO TEST\n')
  console.log('='.repeat(60))
  
  let allGood = true
  
  // 1. Check environment variables
  console.log('\n1️⃣  ENVIRONMENT VARIABLES:')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ASSEMBLYAI_API_KEY',
    'GROQ_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName]
    if (value && value !== 'undefined') {
      console.log(`   ✅ ${varName}: Set`)
    } else {
      console.log(`   ❌ ${varName}: MISSING!`)
      allGood = false
    }
  })
  
  // 2. Check Supabase connection
  console.log('\n2️⃣  SUPABASE CONNECTION:')
  try {
    const { data, error } = await supabase
      .from('recording_sessions')
      .select('count')
      .limit(1)
    
    if (error) throw error
    console.log('   ✅ Connected to Supabase')
  } catch (error) {
    console.log(`   ❌ Failed to connect: ${error.message}`)
    allGood = false
  }
  
  // 3. Check storage bucket exists
  console.log('\n3️⃣  STORAGE BUCKET:')
  try {
    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .list('', { limit: 1 })
    
    if (error) throw error
    console.log('   ✅ meeting-recordings bucket exists')
  } catch (error) {
    console.log(`   ❌ Bucket error: ${error.message}`)
    allGood = false
  }
  
  // 4. Check if user has projects
  console.log('\n4️⃣  USER PROJECTS:')
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, owner_id')
      .limit(5)
    
    if (error) throw error
    
    if (projects && projects.length > 0) {
      console.log(`   ✅ Found ${projects.length} project(s):`)
      projects.forEach(p => {
        console.log(`      - ${p.name} (${p.id})`)
      })
    } else {
      console.log('   ⚠️  No projects found!')
      console.log('      You MUST create a project before recording.')
      allGood = false
    }
  } catch (error) {
    console.log(`   ❌ Error checking projects: ${error.message}`)
  }
  
  // 5. Check API routes exist
  console.log('\n5️⃣  API ROUTES:')
  const apiRoutes = [
    'app/api/recordings/route.ts',
    'app/api/transcribe/route.ts',
    'app/api/process-recording/route.ts'
  ]
  
  const fs = require('fs')
  apiRoutes.forEach(route => {
    if (fs.existsSync(route)) {
      console.log(`   ✅ ${route}`)
    } else {
      console.log(`   ❌ ${route} NOT FOUND!`)
      allGood = false
    }
  })
  
  // 6. Check component exists
  console.log('\n6️⃣  RECORDING COMPONENT:')
  if (fs.existsSync('components/meetings/minimizable-recording-widget.tsx')) {
    console.log('   ✅ minimizable-recording-widget.tsx exists')
    
    // Check if it uses the correct API
    const componentCode = fs.readFileSync('components/meetings/minimizable-recording-widget.tsx', 'utf8')
    if (componentCode.includes('/api/recordings')) {
      console.log('   ✅ Uses /api/recordings endpoint')
    } else {
      console.log('   ❌ NOT using /api/recordings (old code!)')
      console.log('      → Need to pull latest changes from GitHub')
      allGood = false
    }
  } else {
    console.log('   ❌ Component file not found!')
    allGood = false
  }
  
  // 7. Check recent recordings
  console.log('\n7️⃣  RECENT RECORDINGS:')
  try {
    const { data: recordings, error } = await supabase
      .from('recording_sessions')
      .select('id, title, created_at, transcription_status, ai_processed, file_path')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (error) throw error
    
    if (recordings && recordings.length > 0) {
      console.log(`   Found ${recordings.length} recent recording(s):`)
      recordings.forEach((rec, i) => {
        const isOldFormat = rec.file_path?.startsWith('http')
        console.log(`   ${i + 1}. ${rec.title}`)
        console.log(`      Status: ${rec.transcription_status}`)
        console.log(`      File path: ${isOldFormat ? '❌ OLD FORMAT (full URL)' : '✅ CORRECT (relative path)'}`)
      })
    } else {
      console.log('   ℹ️  No recordings yet (this is fine for first test)')
    }
  } catch (error) {
    console.log(`   ❌ Error checking recordings: ${error.message}`)
  }
  
  // FINAL VERDICT
  console.log('\n' + '='.repeat(60))
  if (allGood) {
    console.log('\n✅ ALL SYSTEMS GO! Ready to test recording.\n')
    console.log('📋 NEXT STEPS:')
    console.log('   1. Make sure Vercel deployment is "Ready"')
    console.log('   2. Hard refresh browser (Ctrl+Shift+R)')
    console.log('   3. Open browser console (F12)')
    console.log('   4. Go to Meetings page')
    console.log('   5. Click "Start Recording"')
    console.log('   6. Select a project (REQUIRED)')
    console.log('   7. Record 10-30 seconds of speech')
    console.log('   8. Stop and wait 30-90 seconds')
    console.log('   9. Check Tasks page for extracted tasks\n')
  } else {
    console.log('\n⚠️  ISSUES FOUND! Fix these before testing:\n')
    console.log('   - Review the ❌ items above')
    console.log('   - Make sure all env vars are set')
    console.log('   - Create at least one project if needed')
    console.log('   - Pull latest code from GitHub if component is outdated\n')
  }
}

verifyRecordingReady().catch(console.error)

