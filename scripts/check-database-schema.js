require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabaseSchema() {
  console.log('🔍 CHECKING DATABASE SCHEMA\n')
  console.log('='.repeat(60))

  // Check recording_sessions table
  console.log('\n1️⃣  RECORDING_SESSIONS TABLE:')
  try {
    const { data, error } = await supabase
      .from('recording_sessions')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
      console.log(`   This table might not exist or have permission issues`)
    } else {
      console.log('   ✅ Table exists and accessible')
      if (data && data.length > 0) {
        console.log('   Columns found:')
        Object.keys(data[0]).forEach(col => {
          console.log(`      - ${col}`)
        })
      } else {
        console.log('   ℹ️  Table is empty (no data to show columns)')
        console.log('   Expected columns:')
        const expectedCols = [
          'id', 'user_id', 'title', 'file_path', 'file_size', 'duration',
          'transcription_status', 'transcription_text', 'transcription_confidence',
          'assemblyai_job_id', 'ai_processed', 'processing_error', 'metadata',
          'created_at', 'updated_at'
        ]
        expectedCols.forEach(col => console.log(`      - ${col}`))
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
  }

  // Check meetings table
  console.log('\n2️⃣  MEETINGS TABLE:')
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log('   ✅ Table exists and accessible')
      if (data && data.length > 0) {
        console.log('   Columns found:')
        Object.keys(data[0]).forEach(col => {
          console.log(`      - ${col}`)
        })
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
  }

  // Check tasks table
  console.log('\n3️⃣  TASKS TABLE:')
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log('   ✅ Table exists and accessible')
      if (data && data.length > 0) {
        console.log('   Columns found:')
        Object.keys(data[0]).forEach(col => {
          console.log(`      - ${col}`)
        })
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
  }

  // Check projects table
  console.log('\n4️⃣  PROJECTS TABLE:')
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, owner_id')
      .limit(5)

    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log('   ✅ Table exists and accessible')
      console.log(`   Found ${data?.length || 0} project(s)`)
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
  }

  // Test insert permissions
  console.log('\n5️⃣  TESTING WRITE PERMISSIONS:')
  
  // Test recording_sessions insert
  console.log('   Testing recording_sessions insert...')
  const testSessionId = 'test-' + Date.now()
  const { error: insertError } = await supabase
    .from('recording_sessions')
    .insert({
      id: testSessionId,
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      title: 'Test Recording',
      file_path: 'test/path.webm',
      transcription_status: 'pending',
      ai_processed: false,
      metadata: { test: true }
    })

  if (insertError) {
    console.log(`   ❌ Insert failed: ${insertError.message}`)
    console.log(`      This might be a permissions issue`)
  } else {
    console.log('   ✅ Insert successful')
    // Clean up
    await supabase
      .from('recording_sessions')
      .delete()
      .eq('id', testSessionId)
    console.log('   ✅ Test record cleaned up')
  }

  // Check Supabase Storage permissions
  console.log('\n6️⃣  STORAGE PERMISSIONS:')
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.log(`   ❌ Error listing buckets: ${error.message}`)
    } else {
      console.log('   ✅ Can list buckets')
      const meetingBucket = buckets.find(b => b.name === 'meeting-recordings')
      if (meetingBucket) {
        console.log('   ✅ meeting-recordings bucket found')
        console.log(`      Public: ${meetingBucket.public}`)
      } else {
        console.log('   ❌ meeting-recordings bucket NOT found')
      }
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n📊 SUMMARY:\n')
  console.log('All critical tables and permissions have been checked.')
  console.log('If everything shows ✅, the database is ready for recordings.\n')
}

checkDatabaseSchema().catch(console.error)

