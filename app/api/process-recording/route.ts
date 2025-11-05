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
    let taskExtraction
    try {
      taskExtraction = await aiService.extractTasksFromText(transcriptionText)
      console.log(`📋 Extracted ${taskExtraction?.tasks?.length || 0} tasks`)
      
      // Validate task extraction result
      if (!taskExtraction || typeof taskExtraction !== 'object') {
        throw new Error('Task extraction returned invalid result')
      }
      
      if (!Array.isArray(taskExtraction.tasks)) {
        console.warn('⚠️ Task extraction tasks is not an array, setting to empty array')
        taskExtraction.tasks = []
      }
      
      if (!taskExtraction.summary) {
        console.warn('⚠️ Task extraction summary is missing, generating fallback')
        taskExtraction.summary = 'Meeting summary will be generated shortly.'
      }
      
      if (typeof taskExtraction.confidence !== 'number') {
        taskExtraction.confidence = 0.5
      }
    } catch (extractionError: any) {
      console.error('❌ Error extracting tasks:', extractionError)
      // Use fallback empty extraction
      taskExtraction = {
        tasks: [],
        summary: 'Unable to extract tasks automatically. Please review the transcript manually.',
        confidence: 0
      }
      console.warn('⚠️ Using fallback task extraction')
    }

    // 3. Generate meaningful meeting title using improved prompt
    let meetingTitle = session.title || `Recording - ${new Date(session.created_at).toLocaleDateString()}`
    
    try {
      // Use a better prompt for title generation
      const titlePrompt = `You are a meeting title generator. Analyze this meeting transcript and generate a concise, professional title (max 60 characters).

The title should:
- Capture the main topic or purpose
- Be specific and descriptive
- Use professional language
- Be 60 characters or less

Examples of good titles:
- "Q4 Product Roadmap Planning"
- "Bug Fix Discussion - Login Issue"
- "Sprint Planning - Week 42"
- "Customer Feedback Review Session"

Meeting Transcript:
${transcriptionText.substring(0, 1000)}

Generate ONLY the title text (no quotes, no JSON, no explanation, just the title):`

      const generatedTitle = await aiService.analyzeWithFallback(titlePrompt)
      
      // Clean up the response
      let cleanedTitle = generatedTitle
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^Title:\s*/i, '') // Remove "Title:" prefix if present
        .replace(/\n.*/g, '') // Remove any newlines and everything after
        .trim()
        .substring(0, 60) // Ensure max 60 chars
      
      if (cleanedTitle && cleanedTitle.length > 5 && cleanedTitle !== 'Meeting Recording') {
        meetingTitle = cleanedTitle
        console.log(`📝 Generated intelligent title: "${meetingTitle}"`)
      } else {
        console.warn(`⚠️ Title generation returned invalid result, using default: "${generatedTitle}"`)
      }
    } catch (titleError) {
      console.error('❌ Error generating title:', titleError)
      // Keep the default title
    }

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
      participants: [],
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
        
        // ✅ Link tasks to meeting via meeting_tasks table
        if (createdTasks && createdTasks.length > 0) {
          const meetingTaskLinks = createdTasks.map((task: any) => ({
            meeting_id: meeting.id,
            task_id: task.id
          }))
          
          const { error: linkError } = await supabase
            .from('meeting_tasks')
            .insert(meetingTaskLinks)
          
          if (linkError) {
            console.warn('Error linking tasks to meeting:', linkError)
          } else {
            console.log(`✅ Linked ${createdTasks.length} tasks to meeting ${meeting.id}`)
          }
        }
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
  } catch (error: any) {
    // Better error serialization - handle all error types
    let errorMessage = 'Unknown error'
    let errorDetails = ''
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
    } else if (typeof error === 'string') {
      errorMessage = error
      errorDetails = error
    } else if (error && typeof error === 'object') {
      // Handle Supabase errors and other object errors
      if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = typeof error.error === 'string' ? error.error : error.error.message || 'Unknown error'
      } else {
        errorMessage = JSON.stringify(error)
      }
      errorDetails = error.code ? `${error.code}: ${errorMessage}` : errorMessage
    }
    
    console.error('❌ Error in process-recording API:', errorMessage)
    console.error('   Full error:', error)
    console.error('   Error type:', error?.constructor?.name || typeof error)
    
    return NextResponse.json(
      {
        error: 'Failed to process recording',
        details: errorDetails.substring(0, 500), // Limit length
        message: errorMessage,
        errorType: error?.constructor?.name || typeof error,
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

