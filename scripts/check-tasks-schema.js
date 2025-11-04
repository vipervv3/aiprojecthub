require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTasksSchema() {
  console.log('🔍 CHECKING TASKS TABLE SCHEMA\n')

  // Try to get a few tasks to see the structure
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(5)

  if (error) {
    console.error('❌ Error fetching tasks:', error)
    return
  }

  console.log(`Found ${tasks?.length || 0} tasks\n`)

  if (tasks && tasks.length > 0) {
    console.log('Sample task structure:')
    const task = tasks[0]
    console.log(JSON.stringify(task, null, 2))
    console.log(`\nTags field type: ${typeof task.tags}`)
    console.log(`Tags value:`, task.tags)
  }

  // Try different queries to find meeting-generated tasks
  console.log('\n' + '='.repeat(60))
  console.log('Trying different query approaches:\n')

  // Approach 1: Check if tags is an array
  const { data: tasks1, error: err1 } = await supabase
    .from('tasks')
    .select('id, title, tags, is_ai_generated')
    .eq('is_ai_generated', true)

  console.log(`1. By is_ai_generated flag: ${tasks1?.length || 0} tasks`)
  if (err1) console.log(`   Error: ${err1.message}`)
  if (tasks1 && tasks1.length > 0) {
    tasks1.forEach(t => {
      console.log(`   - ${t.title}`)
      console.log(`     Tags: ${JSON.stringify(t.tags)}`)
    })
  }

  // Approach 2: Filter by tags containing 'meeting-generated'
  const { data: tasks2, error: err2 } = await supabase
    .from('tasks')
    .select('id, title, tags')
    .filter('tags', 'cs', '{"meeting-generated"}')

  console.log(`\n2. By tags filter (cs operator): ${tasks2?.length || 0} tasks`)
  if (err2) console.log(`   Error: ${err2.message}`)

  // Approach 3: Try textSearch
  const { data: tasks3, error: err3 } = await supabase
    .from('tasks')
    .select('id, title, tags')
    .textSearch('tags', 'meeting-generated')

  console.log(`\n3. By textSearch: ${tasks3?.length || 0} tasks`)
  if (err3) console.log(`   Error: ${err3.message}`)

  // Check the meeting that was created
  console.log('\n' + '='.repeat(60))
  console.log('Checking the specific meeting:\n')

  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', '79ebb51d-2384-4c1c-a05a-596bebc60daa')
    .single()

  if (meeting) {
    console.log(`Meeting: ${meeting.title}`)
    console.log(`Recording session: ${meeting.recording_session_id}`)
    console.log(`Action items:`, meeting.action_items)
    console.log(`\nNow checking if tasks exist for this meeting...`)

    // Try to find tasks that should have been created
    const { data: allTasks, error: allErr } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log(`\nLast 10 tasks created:`)
    if (allTasks) {
      allTasks.forEach(t => {
        console.log(`- [${t.created_at}] ${t.title}`)
        console.log(`  Project: ${t.project_id || 'None'}`)
        console.log(`  Tags: ${JSON.stringify(t.tags)}`)
        console.log(`  AI Generated: ${t.is_ai_generated}`)
      })
    }
  }
}

checkTasksSchema().catch(console.error)

