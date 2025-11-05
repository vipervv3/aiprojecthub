import { NextRequest, NextResponse } from 'next/server'
import { GroqService } from '@/lib/services/groq-service'
import { dataService } from '@/lib/data-service'
import { supabaseAdmin } from '@/lib/supabase'

const groq = new GroqService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript, projectId, meetingId, userId } = body

    if (!transcript || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript, projectId, userId' },
        { status: 400 }
      )
    }

    console.log(`Generating tasks from transcript for project: ${projectId}`)

    // Get project context
    let projectContext = ''
    try {
      const projects = await dataService.getProjects(userId)
      const project = projects.find((p: any) => p.id === projectId)
      if (project) {
        projectContext = `Project: ${project.name}\nDescription: ${project.description || 'No description'}`
      }
    } catch (error) {
      console.warn('Could not load project context:', error)
    }

    // Generate meeting title from transcript
    const generatedTitle = await groq.generateMeetingTitle(transcript)
    console.log(`AI Generated Title: ${generatedTitle}`)

    // Analyze transcript and extract tasks
    const analysis = await groq.analyzeTranscript(transcript, projectContext)

    // Create tasks in database
    const createdTasks = []
    for (const extractedTask of analysis.tasks) {
      try {
        // ✅ Automatically set due date to 7 days from now if not provided
        let dueDate = extractedTask.due_date
        if (!dueDate) {
          const dueDateObj = new Date()
          dueDateObj.setDate(dueDateObj.getDate() + 7) // Add 7 days
          dueDate = dueDateObj.toISOString()
          console.log(`📅 Auto-assigned due date (7 days) for task "${extractedTask.title}": ${dueDate}`)
        }
        
        const taskData = {
          title: extractedTask.title,
          description: extractedTask.description,
          project_id: projectId,
          status: 'todo' as const,
          priority: extractedTask.priority,
          estimated_hours: extractedTask.estimated_hours,
          due_date: dueDate,
          is_ai_generated: true,
          ai_priority_score: 0.8, // High confidence for explicitly mentioned tasks
        }

        const createdTask = await dataService.createTask(taskData, userId)
        
        if (createdTask) {
          createdTasks.push(createdTask)
          
          // Link task to meeting if meeting ID provided
          if (meetingId && supabaseAdmin) {
            await supabaseAdmin
              .from('meeting_tasks')
              .insert({
                meeting_id: meetingId,
                task_id: createdTask.id,
              })
          }
        }
      } catch (error) {
        console.error('Error creating task:', error)
      }
    }

    // Update meeting with summary AND generated title
    if (meetingId && supabaseAdmin) {
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('meetings')
        .update({
          title: generatedTitle, // AI-generated title
          summary: analysis.summary.summary,
          action_items: analysis.summary.actionItems,
          ai_insights: {
            keyPoints: analysis.summary.keyPoints,
            tasksGenerated: createdTasks.length,
            processingDate: new Date().toISOString(),
            titleGenerated: true,
          },
        })
        .eq('id', meetingId)
        .select()
      
      if (updateError) {
        console.error('❌ Error updating meeting:', updateError)
      } else {
        console.log(`✅ Updated meeting ${meetingId} with AI-generated title: ${generatedTitle}`)
        console.log('   Summary saved:', !!analysis.summary.summary)
        console.log('   AI insights saved:', !!updateData)
      }
    }

    // Update recording session with AI processing status
    const { data: recordingSessions } = await supabaseAdmin!
      .from('recording_sessions')
      .select('id')
      .eq('metadata->>meetingId', meetingId)
      .single()

    if (recordingSessions && supabaseAdmin) {
      await supabaseAdmin
        .from('recording_sessions')
        .update({
          ai_processed: true,
        })
        .eq('id', recordingSessions.id)
    }

    console.log(`Generated ${createdTasks.length} tasks from transcript`)
    console.log(`Meeting title: ${generatedTitle}`)

    return NextResponse.json({
      success: true,
      summary: analysis.summary,
      tasks: createdTasks,
      tasksCreated: createdTasks.length,
      meetingTitle: generatedTitle,
    })
  } catch (error) {
    console.error('Error in generate-tasks API:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Get tasks for a meeting
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const meetingId = searchParams.get('meetingId')

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Missing meetingId parameter' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Get tasks linked to this meeting
    const { data: meetingTasks, error } = await supabaseAdmin
      .from('meeting_tasks')
      .select(`
        task_id,
        tasks (*)
      `)
      .eq('meeting_id', meetingId)

    if (error) {
      throw error
    }

    const tasks = meetingTasks?.map((mt: any) => mt.tasks) || []

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    })
  } catch (error) {
    console.error('Error getting meeting tasks:', error)
    return NextResponse.json(
      {
        error: 'Failed to get meeting tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

