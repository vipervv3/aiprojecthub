import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AIService } from '@/lib/ai/services'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * Process a completed transcription:
 * 1. Extract tasks and action items
 * 2. Generate meeting summary
 * 3. Create meaningful title
 * 4. Save to meetings table
 * 5. Create tasks in tasks table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, projectId } = body

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userId' },
        { status: 400 }
      )
    }
    
    console.log(`🤖 Processing with project context: ${projectId || 'none'}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get recording session with transcription
    const { data: session, error: sessionError } = await supabase
      .from('recording_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Recording session not found' },
        { status: 404 }
      )
    }

    if (!session.transcription_text) {
      return NextResponse.json(
        { error: 'No transcription available for this recording' },
        { status: 400 }
      )
    }

    if (session.ai_processed) {
      return NextResponse.json(
        { message: 'Recording already processed', session },
        { status: 200 }
      )
    }

    console.log(`🤖 Starting AI processing for session: ${sessionId}`)

    const aiService = AIService.getInstance()
    const transcriptionText = session.transcription_text

    // 2. Extract tasks and get summary
    const taskExtraction = await aiService.extractTasksFromText(transcriptionText)
    
    console.log(`📋 Extracted ${taskExtraction.tasks.length} tasks`)

    // 3. Generate meaningful meeting title
    const titlePrompt = `Generate a concise, professional meeting title (max 60 chars) for this transcription:\n\n${transcriptionText.substring(0, 500)}...`
    const generatedTitle = await aiService.analyzeWithFallback(titlePrompt)
    const meetingTitle = generatedTitle.replace(/['"]/g, '').trim().substring(0, 60) || session.title

    console.log(`📝 Generated title: "${meetingTitle}"`)

    // 4. Create meeting record
    const meetingData = {
      title: meetingTitle,
      description: `AI-processed recording from ${new Date(session.created_at).toLocaleString()}`,
      scheduled_at: session.created_at,
      duration: session.duration || 0,
      recording_session_id: sessionId,
      summary: taskExtraction.summary,
      action_items: taskExtraction.tasks.map(t => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        completed: false
      })),
      attendees: [],
      meeting_type: 'regular' as const,
      ai_insights: {
        confidence: taskExtraction.confidence,
        tasks_extracted: taskExtraction.tasks.length,
        processed_at: new Date().toISOString(),
        transcription_provider: 'assemblyai'
      }
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert(meetingData)
      .select()
      .single()

    if (meetingError) {
      console.error('Error creating meeting:', meetingError)
      throw meetingError
    }

    console.log(`✅ Meeting created: ${meeting.id}`)

    // 5. Create tasks in tasks table
    let createdTasksCount = 0
    let tasksToCreate: any[] = []
    
    // Try to use extracted tasks first
    if (taskExtraction.tasks.length > 0) {
      tasksToCreate = taskExtraction.tasks.map(task => ({
        title: task.title,
        description: task.description,
        project_id: projectId || null, // ✅ Associate with selected project
        assignee_id: task.assignee === 'User' ? userId : null,
        status: 'todo' as const,
        priority: task.priority,
        is_ai_generated: true,
        ai_priority_score: taskExtraction.confidence,
        due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        estimated_hours: task.estimatedHours || null,
        tags: ['meeting-generated', `meeting:${meeting.id}`],
      }))
      console.log(`📋 Creating ${tasksToCreate.length} tasks from task extraction`)
    } else if (meeting.action_items && meeting.action_items.length > 0) {
      // Fallback: Create tasks from action items if task extraction failed
      console.log(`⚠️  Task extraction returned 0, using action items as fallback`)
      tasksToCreate = meeting.action_items.map((item: any) => ({
        title: typeof item === 'string' ? item : item.title || item,
        description: typeof item === 'string' ? `From meeting: ${meeting.title}` : item.description || `From meeting: ${meeting.title}`,
        project_id: projectId || null,
        assignee_id: null,
        status: 'todo' as const,
        priority: (typeof item === 'object' && item.priority) ? item.priority : 'medium' as const,
        is_ai_generated: true,
        ai_priority_score: taskExtraction.confidence || 0.5,
        due_date: null,
        estimated_hours: null,
        tags: ['meeting-generated', `meeting:${meeting.id}`],
      }))
      console.log(`📋 Creating ${tasksToCreate.length} tasks from action items`)
    }
    
    if (tasksToCreate.length > 0) {

      const { data: createdTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select()

      if (tasksError) {
        console.warn('Error creating tasks:', tasksError)
      } else {
        createdTasksCount = createdTasks?.length || 0
        console.log(`✅ Created ${createdTasksCount} tasks`)
      }
    }

    // 6. Mark recording as processed
    await supabase
      .from('recording_sessions')
      .update({
        ai_processed: true,
        title: meetingTitle, // Update recording title too
        metadata: {
          ...session.metadata,
          meeting_id: meeting.id,
          tasks_created: createdTasksCount,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', sessionId)

    console.log(`🎉 AI processing complete for session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      meeting,
      tasksCreated: createdTasksCount,
      summary: taskExtraction.summary,
      confidence: taskExtraction.confidence,
      message: `Created meeting "${meetingTitle}" with ${createdTasksCount} tasks`
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : String(error)
    console.error('❌ Error in process-recording API:', errorMessage)
    console.error('   Full error:', errorStack)
    return NextResponse.json(
      {
        error: 'Failed to process recording',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if a recording has been processed
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: session, error } = await supabase
      .from('recording_sessions')
      .select('ai_processed, transcription_status, metadata')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Recording session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      processed: session.ai_processed,
      transcriptionStatus: session.transcription_status,
      meetingId: session.metadata?.meeting_id
    })
  } catch (error) {
    console.error('Error checking recording status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check recording status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

