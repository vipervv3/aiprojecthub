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
      .select('id, project_id, user_id, recording_session_id')
      .eq('id', meetingId)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Verify ownership
    if (meeting.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find tasks that should be linked to this meeting
    // Look for tasks with:
    // 1. Same project_id as meeting (if meeting has project_id)
    // 2. Tags containing the meeting ID OR meeting-generated tag
    // 3. is_ai_generated = true
    // 4. Created around the same time as the meeting

    let potentialTasks: any[] = []
    
    if (meeting.project_id) {
      // Search by project_id and tags
      const { data: tasksByProject, error: projectTasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, title, project_id, tags, created_at, is_ai_generated')
        .eq('project_id', meeting.project_id)
        .eq('is_ai_generated', true)
        .contains('tags', ['meeting-generated'])

      if (!projectTasksError && tasksByProject) {
        // Filter by meeting ID in tags OR created around the same time as meeting
        const { data: meetingData } = await supabaseAdmin
          .from('meetings')
          .select('created_at')
          .eq('id', meetingId)
          .single()

        const meetingCreatedAt = meetingData?.created_at ? new Date(meetingData.created_at) : null
        const timeWindow = 5 * 60 * 1000 // 5 minutes window

        potentialTasks = tasksByProject.filter(task => {
          // Check if tags contain meeting ID
          const tags = task.tags || []
          const hasMeetingTag = Array.isArray(tags) && tags.some((tag: string) => 
            typeof tag === 'string' && tag.includes(`meeting:${meetingId}`)
          )
          
          // Or check if created around the same time
          let timeMatch = false
          if (meetingCreatedAt && task.created_at) {
            const taskCreatedAt = new Date(task.created_at)
            const timeDiff = Math.abs(taskCreatedAt.getTime() - meetingCreatedAt.getTime())
            timeMatch = timeDiff < timeWindow
          }
          
          return hasMeetingTag || timeMatch
        })
      }
    } else {
      // If no project_id, search by tags only
      const { data: tasksByTags, error: tagsTasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, title, project_id, tags, created_at, is_ai_generated')
        .eq('is_ai_generated', true)
        .contains('tags', ['meeting-generated'])

      if (!tagsTasksError && tasksByTags) {
        potentialTasks = tasksByTags.filter(task => {
          const tags = task.tags || []
          return Array.isArray(tags) && tags.some((tag: string) => 
            typeof tag === 'string' && tag.includes(`meeting:${meetingId}`)
          )
        })
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

