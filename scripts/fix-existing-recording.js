#!/usr/bin/env node

/**
 * Retroactively fix existing recording by creating tasks from action items
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xekyfsnxrnfkdvrcsiye.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhla3lmc254cm5ma2R2cmNzaXllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MTEwOCwiZXhwIjoyMDc0OTQ3MTA4fQ.Z52BROntVXYXW2gfKGPcHu2kjuNBI6fPJSawh5UND_w'

async function fixRecording() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔧 Fixing existing recording...\n')
  
  const meetingId = 'a9b51bcd-0f96-4063-9f63-616ffa47b37c'
  const projectId = 'e23731b8-a924-480a-9d69-2a742fdb47ba'
  
  // Get meeting
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()
  
  if (error || !meeting) {
    console.log('❌ Meeting not found')
    return
  }
  
  console.log(`✅ Meeting: "${meeting.title}"`)
  console.log(`📋 Action Items: ${meeting.action_items?.length || 0}`)
  console.log(`📁 Project ID: ${projectId}`)
  
  if (!meeting.action_items || meeting.action_items.length === 0) {
    console.log('⚠️  No action items to convert')
    return
  }
  
  // Create tasks from action items
  const tasksToCreate = meeting.action_items.map((item) => ({
    title: typeof item === 'string' ? item : item.title,
    description: typeof item === 'string' 
      ? `From meeting: ${meeting.title}` 
      : item.description || `From meeting: ${meeting.title}`,
    project_id: projectId,
    assignee_id: null,
    status: 'todo',
    priority: (typeof item === 'object' && item.priority) ? item.priority : 'medium',
    is_ai_generated: true,
    ai_priority_score: 0.7,
    due_date: null,
    estimated_hours: null,
    tags: ['meeting-generated', `meeting:${meetingId}`],
  }))
  
  console.log(`\n📝 Creating ${tasksToCreate.length} tasks...`)
  
  const { data: createdTasks, error: tasksError } = await supabase
    .from('tasks')
    .insert(tasksToCreate)
    .select()
  
  if (tasksError) {
    console.log('❌ Error creating tasks:', tasksError.message)
    return
  }
  
  console.log(`✅ Created ${createdTasks.length} tasks:\n`)
  
  createdTasks.forEach((task, i) => {
    console.log(`${i + 1}. "${task.title}"`)
    console.log(`   Priority: ${task.priority} | Project: ${task.project_id ? 'Linked ✅' : 'Not linked ❌'}`)
  })
  
  console.log('\n✅ Done! Go to Tasks page and filter by your project to see them.')
}

fixRecording().catch(console.error)

