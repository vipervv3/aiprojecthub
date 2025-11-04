require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAllRecordings() {
  console.log('🔍 CHECKING ALL RECORDINGS AND THEIR TASK STATUS\n')
  console.log('=' .repeat(70))

  // Get all recordings
  const { data: recordings, error } = await supabase
    .from('recording_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`\nFound ${recordings.length} total recordings\n`)

  for (let i = 0; i < recordings.length; i++) {
    const rec = recordings[i]
    console.log(`\n${i + 1}. 📹 ${rec.title}`)
    console.log(`   ID: ${rec.id}`)
    console.log(`   Created: ${new Date(rec.created_at).toLocaleString()}`)
    console.log(`   File Path: ${rec.file_path}`)
    console.log(`   File Size: ${rec.file_size} bytes`)
    console.log(`   Duration: ${rec.duration} seconds`)
    console.log(`   Transcription: ${rec.transcription_status}`)
    console.log(`   AI Processed: ${rec.ai_processed ? 'YES' : 'NO'}`)
    console.log(`   Project in metadata: ${rec.metadata?.projectId || 'None'}`)

    // Check if meeting exists
    const { data: meetings } = await supabase
      .from('meetings')
      .select('id, title, recording_session_id')
      .eq('recording_session_id', rec.id)

    if (meetings && meetings.length > 0) {
      const meeting = meetings[0]
      console.log(`   ✅ Meeting: ${meeting.title} (${meeting.id})`)

      // Check tasks for this meeting
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .eq('is_ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(50)

      // Filter tasks that have this meeting in tags
      const meetingTasks = tasks?.filter(t => 
        t && Array.isArray(t.tags) && t.tags.some(tag => tag.includes(meeting.id))
      ) || []

      if (meetingTasks.length > 0) {
        console.log(`   ✅ ${meetingTasks.length} Task(s) created:`)
        meetingTasks.forEach(t => {
          console.log(`      - ${t.title} (Project: ${t.project_id || 'None'})`)
        })
      } else {
        console.log(`   ❌ NO tasks extracted!`)
      }
    } else {
      console.log(`   ❌ No meeting created`)
    }

    console.log('   ' + '─'.repeat(66))
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 SUMMARY:\n')

  const withMeetings = recordings.filter(r => r.ai_processed)
  const withTasks = []
  
  for (const rec of withMeetings) {
    const { data: meetings } = await supabase
      .from('meetings')
      .select('id')
      .eq('recording_session_id', rec.id)
    
    if (meetings && meetings.length > 0) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('is_ai_generated', true)
        .limit(100)
      
      const hasTasks = tasks?.some(t => 
        t && Array.isArray(t.tags) && t.tags.some(tag => tag.includes(meetings[0].id))
      )
      
      if (hasTasks) {
        withTasks.push(rec)
      }
    }
  }

  console.log(`Total recordings: ${recordings.length}`)
  console.log(`With meetings created: ${withMeetings.length}`)
  console.log(`With tasks extracted: ${withTasks.length}`)
  console.log(`Missing tasks: ${withMeetings.length - withTasks.length}`)

  if (withMeetings.length > withTasks.length) {
    console.log('\n⚠️  Some recordings are processed but have no tasks!')
    console.log('This is the issue that needs to be fixed.')
  }
}

checkAllRecordings().catch(console.error)

