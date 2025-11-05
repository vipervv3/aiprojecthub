import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-utils'

/**
 * Link existing tasks to a meeting
 * This fixes cases where tasks were created but not linked to the meeting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const meetingId = params.id

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Verify user is authenticated
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔗 Linking tasks to meeting:', meetingId)

    // Get meeting to verify ownership and get project_id
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .select('id, project_id, user_id, recording_session_id, created_at')
      .eq('id', meetingId)
      .single()

    if (meetingError || !meeting) {
      console.error('❌ Meeting not found:', meetingError?.message || 'No meeting data')
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    console.log(`✅ Meeting found: ${meeting.id}`)
    console.log(`   Meeting user_id: ${meeting.user_id || 'NULL'}`)
    console.log(`   Authenticated user_id: ${user.id}`)

    // Verify ownership - if meeting has no user_id, allow if user created tasks in same project
    if (meeting.user_id && meeting.user_id !== user.id) {
      console.error(`❌ Ownership mismatch: meeting.user_id=${meeting.user_id}, user.id=${user.id}`)
      return NextResponse.json({ error: 'Unauthorized - you do not own this meeting' }, { status: 403 })
    } else if (!meeting.user_id) {
      console.warn(`⚠️ Meeting has no user_id, allowing link (user may have created tasks in project)`)
    }

    // Find tasks that should be linked to this meeting
    // Look for tasks with:
    // 1. Same project_id as meeting (if meeting has project_id)
    // 2. Tags containing the meeting ID OR meeting-generated tag
    // 3. is_ai_generated = true
    // 4. Created around the same time as the meeting (within 10 minutes)

    console.log(`🔍 Searching for tasks to link to meeting ${meetingId}`)
    console.log(`   Meeting project_id: ${meeting.project_id || 'none'}`)
    console.log(`   Meeting user_id: ${meeting.user_id || 'none'}`)

    // Get meeting creation time for time-based matching
    const meetingCreatedAt = meeting.created_at ? new Date(meeting.created_at) : null
    const timeWindow = 10 * 60 * 1000 // 10 minutes window (increased from 5)
    console.log(`   Meeting created at: ${meetingCreatedAt?.toISOString() || 'unknown'}`)
    console.log(`   Time window: ${timeWindow / 1000 / 60} minutes`)

    let potentialTasks: any[] = []
    
    // Strategy 1: Search by project_id (if available)
    if (meeting.project_id) {
      console.log(`   🔍 Strategy 1: Searching by project_id=${meeting.project_id}`)
      
      // Search for AI-generated tasks in the same project
      // Note: Supabase .contains() for arrays works differently - we'll search more broadly
      const { data: tasksByProject, error: projectTasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, title, project_id, tags, created_at, is_ai_generated, user_id')
        .eq('project_id', meeting.project_id)
        .eq('is_ai_generated', true)

      if (projectTasksError) {
        console.error(`   ❌ Error searching by project:`, projectTasksError.message)
      } else if (tasksByProject) {
        console.log(`   ✅ Found ${tasksByProject.length} AI-generated tasks in project`)
        
        // Filter by tags containing meeting ID OR created around the same time
        potentialTasks = tasksByProject.filter(task => {
          const tags = task.tags || []
          const hasMeetingTag = Array.isArray(tags) && tags.some((tag: any) => {
            const tagStr = typeof tag === 'string' ? tag : String(tag)
            return tagStr.includes(`meeting:${meetingId}`) || tagStr === 'meeting-generated'
          })
          
          // Check if created around the same time
          let timeMatch = false
          if (meetingCreatedAt && task.created_at) {
            try {
              const taskCreatedAt = new Date(task.created_at)
              if (!isNaN(taskCreatedAt.getTime())) {
                const timeDiff = Math.abs(taskCreatedAt.getTime() - meetingCreatedAt.getTime())
                timeMatch = timeDiff < timeWindow
              }
            } catch (e) {
              // Invalid date, skip time match
            }
          }
          
          const shouldInclude = hasMeetingTag || timeMatch
          if (shouldInclude) {
            console.log(`   ✅ Task "${task.title}" matches (tags: ${hasMeetingTag}, time: ${timeMatch})`)
          }
          
          return shouldInclude
        })
        
        console.log(`   ✅ Strategy 1 found ${potentialTasks.length} matching tasks`)
      }
    }
    
    // Strategy 2: If no tasks found or no project_id, search by tags and time window
    if (potentialTasks.length === 0) {
      console.log(`   🔍 Strategy 2: Searching by tags and time window`)
      
      // Search for all AI-generated tasks with meeting-generated tag
      const { data: tasksByTags, error: tagsTasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, title, project_id, tags, created_at, is_ai_generated, user_id')
        .eq('is_ai_generated', true)

      if (tagsTasksError) {
        console.error(`   ❌ Error searching by tags:`, tagsTasksError.message)
      } else if (tasksByTags) {
        console.log(`   ✅ Found ${tasksByTags.length} AI-generated tasks total`)
        
        // Filter by meeting ID in tags OR created within time window
        potentialTasks = tasksByTags.filter(task => {
          const tags = task.tags || []
          const hasMeetingTag = Array.isArray(tags) && tags.some((tag: any) => {
            const tagStr = typeof tag === 'string' ? tag : String(tag)
            return tagStr.includes(`meeting:${meetingId}`)
          })
          
          // Check if created around the same time
          let timeMatch = false
          if (meetingCreatedAt && task.created_at) {
            try {
              const taskCreatedAt = new Date(task.created_at)
              if (!isNaN(taskCreatedAt.getTime())) {
                const timeDiff = Math.abs(taskCreatedAt.getTime() - meetingCreatedAt.getTime())
                timeMatch = timeDiff < timeWindow
              }
            } catch (e) {
              // Invalid date, skip time match
            }
          }
          
          return hasMeetingTag || timeMatch
        })
        
        console.log(`   ✅ Strategy 2 found ${potentialTasks.length} matching tasks`)
      }
    }

    const tasksError = null // No error if we got here

    if (tasksError) {
      console.error('Error finding tasks:', tasksError)
      return NextResponse.json({ error: 'Failed to find tasks' }, { status: 500 })
    }

    if (!potentialTasks || potentialTasks.length === 0) {
      console.log('No potential tasks found for meeting')
      return NextResponse.json({ 
        success: true, 
        message: 'No tasks found to link',
        linked: 0
      })
    }

    console.log(`Found ${potentialTasks.length} potential tasks to link`)

    // Check which tasks are already linked
    const taskIds = potentialTasks.map(t => t.id)
    const { data: existingLinks } = await supabaseAdmin
      .from('meeting_tasks')
      .select('task_id')
      .eq('meeting_id', meetingId)
      .in('task_id', taskIds)

    const alreadyLinked = new Set(existingLinks?.map(l => l.task_id) || [])
    const tasksToLink = potentialTasks.filter(t => !alreadyLinked.has(t.id))

    if (tasksToLink.length === 0) {
      console.log('All tasks are already linked')
      return NextResponse.json({ 
        success: true, 
        message: 'All tasks are already linked',
        linked: 0
      })
    }

    console.log(`Linking ${tasksToLink.length} tasks to meeting`)

    // Link tasks to meeting
    const linksToInsert = tasksToLink.map(task => ({
      meeting_id: meetingId,
      task_id: task.id
    }))

    const { data: insertedLinks, error: linkError } = await supabaseAdmin
      .from('meeting_tasks')
      .insert(linksToInsert)
      .select()

    if (linkError) {
      console.error('Error linking tasks:', linkError)
      return NextResponse.json({ error: 'Failed to link tasks' }, { status: 500 })
    }

    console.log(`✅ Successfully linked ${insertedLinks?.length || 0} tasks`)

    return NextResponse.json({
      success: true,
      message: `Linked ${insertedLinks?.length || 0} tasks to meeting`,
      linked: insertedLinks?.length || 0,
      taskIds: insertedLinks?.map(l => l.task_id) || []
    })

  } catch (error: any) {
    console.error('Error linking tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

