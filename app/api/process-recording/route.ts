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

    // ✅ Get projectId from request body OR session project_id column OR session metadata (fallback)
    const finalProjectId = projectId || (session as any).project_id || session.metadata?.projectId || null
    console.log(`🤖 Processing with project context: ${finalProjectId || 'none'}`)
    console.log(`   From request: ${projectId || 'none'}`)
    console.log(`   From session.project_id: ${(session as any).project_id || 'none'}`)
    console.log(`   From metadata: ${session.metadata?.projectId || 'none'}`)
    console.log(`   Final projectId: ${finalProjectId || 'none'}`)

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
    console.log(`📝 Transcription text length: ${transcriptionText.length} characters`)
    console.log(`📝 First 200 chars: ${transcriptionText.substring(0, 200)}...`)
    
    let taskExtraction
    try {
      // Get project context if available
      let projectContext = null
      if (finalProjectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('name, description')
          .eq('id', finalProjectId)
          .single()
        if (project) {
          projectContext = `Project: ${project.name}${project.description ? ` - ${project.description}` : ''}`
          console.log(`📁 Project context: ${projectContext}`)
        }
      }
      
      taskExtraction = await aiService.extractTasksFromText(transcriptionText, projectContext || undefined)
      console.log(`📋 Extracted ${taskExtraction?.tasks?.length || 0} tasks`)
      
      // Validate task extraction result
      if (!taskExtraction || typeof taskExtraction !== 'object') {
        throw new Error('Task extraction returned invalid result')
      }
      
      if (!Array.isArray(taskExtraction.tasks)) {
        console.warn('⚠️ Task extraction tasks is not an array, setting to empty array')
        taskExtraction.tasks = []
      }
      
      // If no tasks extracted, try to create at least one summary task
      if (taskExtraction.tasks.length === 0 && taskExtraction.summary) {
        console.warn('⚠️ No tasks extracted, creating summary task')
        taskExtraction.tasks = [{
          title: 'Review meeting summary and follow up',
          description: taskExtraction.summary.substring(0, 200),
          priority: 'medium' as const,
          estimatedHours: 1
        }]
      }
      
      if (!taskExtraction.summary) {
        console.warn('⚠️ Task extraction summary is missing, generating fallback')
        taskExtraction.summary = transcriptionText.length > 200 
          ? `${transcriptionText.substring(0, 200)}...`
          : transcriptionText
      }
      
      if (typeof taskExtraction.confidence !== 'number') {
        taskExtraction.confidence = 0.5
      }
    } catch (extractionError: any) {
      console.error('❌ Error extracting tasks:', extractionError)
      console.error('   Error details:', extractionError?.message || extractionError)
      // Use fallback with at least one task
      taskExtraction = {
        tasks: [{
          title: 'Review meeting transcript and extract action items',
          description: transcriptionText.length > 200 
            ? `Review the full transcript: ${transcriptionText.substring(0, 200)}...`
            : `Review the transcript: ${transcriptionText}`,
          priority: 'medium' as const,
          estimatedHours: 1
        }],
        summary: transcriptionText.length > 300 
          ? `${transcriptionText.substring(0, 300)}...`
          : transcriptionText,
        confidence: 0.3
      }
      console.warn('⚠️ Using fallback task extraction with summary task')
    }

    // 3. Generate meaningful meeting title using improved prompt
    let meetingTitle = session.title || `Recording - ${new Date(session.created_at).toLocaleDateString()}`
    
    try {
      console.log(`🎯 Generating intelligent title from transcript...`)
      console.log(`   Current title: "${meetingTitle}"`)
      console.log(`   Transcript length: ${transcriptionText.length} chars`)
      console.log(`   Project context: ${finalProjectId || 'none'}`)
      
      // Check if Groq API key is available before attempting
      if (!process.env.GROQ_API_KEY) {
        console.warn(`⚠️  GROQ_API_KEY not set - skipping intelligent title generation`)
        throw new Error('GROQ_API_KEY not available')
      }
      
      // Use a more explicit prompt for title generation with Groq
      const titleContext = finalProjectId && projectContext 
        ? `Project Context: ${projectContext}\n\n`
        : ''
      
      const titlePrompt = `You are an expert meeting title generator. Analyze this meeting transcript and generate a concise, professional title.

CRITICAL REQUIREMENTS:
- Title must be between 10-60 characters
- Capture the MAIN topic or purpose of the meeting
- Be specific and descriptive (not generic like "Meeting" or "Recording")
- Use professional, business-appropriate language
- Do NOT include quotes, colons after "Title:", or any other prefixes
- Return ONLY the title text, nothing else

${titleContext}Meeting Transcript Excerpt:
${transcriptionText.substring(0, 2000)}

Examples of EXCELLENT titles:
- "Q4 Product Roadmap Planning Session"
- "Bug Fix Discussion - Login Authentication Issue"
- "Sprint 42 Planning - Backend API Development"
- "Customer Feedback Review - Dashboard UX Improvements"
- "Team Standup - Week 45 Status Updates"

Generate ONLY the title (no quotes, no JSON, no explanation, no prefix like "Title:"):`

      console.log(`🤖 Calling Groq AI for title generation...`)
      console.log(`   Prompt length: ${titlePrompt.length} chars`)
      
      const generatedTitle = await aiService.analyzeWithFallback(titlePrompt)
      console.log(`📝 Raw title response: "${generatedTitle}"`)
      console.log(`   Response type: ${typeof generatedTitle}`)
      console.log(`   Response length: ${generatedTitle?.length || 0} chars`)
      
      // Clean up the response more aggressively
      let cleanedTitle = generatedTitle
        .toString()
        .trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^Title:\s*/i, '') // Remove "Title:" prefix
        .replace(/^Meeting Title:\s*/i, '') // Remove "Meeting Title:" prefix
        .replace(/^Generated Title:\s*/i, '') // Remove "Generated Title:" prefix
        .replace(/```json\s*/g, '') // Remove markdown code blocks
        .replace(/```\s*/g, '')
        .replace(/\{[^}]*"title"\s*:\s*"([^"]+)"[^}]*\}/i, '$1') // Extract from JSON if wrapped
        .replace(/\n.*/g, '') // Remove any newlines and everything after
        .replace(/^[^a-zA-Z0-9]+/, '') // Remove leading non-alphanumeric
        .replace(/[^a-zA-Z0-9]+$/, '') // Remove trailing non-alphanumeric
        .trim()
        .substring(0, 60) // Ensure max 60 chars
      
      if (cleanedTitle && cleanedTitle.length >= 10 && cleanedTitle.length <= 60) {
        // ✅ Less strict validation - only reject if title is ONLY a generic word
        // Allow descriptive titles even if they contain generic words
        const genericWords = ['meeting', 'recording', 'call', 'conversation', 'discussion']
        const lowerTitle = cleanedTitle.toLowerCase().trim()
        
        // Check if title is JUST a generic word (not descriptive)
        const isOnlyGeneric = genericWords.includes(lowerTitle) || 
          (lowerTitle.length < 15 && genericWords.some(g => lowerTitle === g || lowerTitle === `${g} ${new Date().getFullYear()}`))
        
        if (!isOnlyGeneric) {
          meetingTitle = cleanedTitle
          console.log(`✅ Generated intelligent title: "${meetingTitle}"`)
          console.log(`   Title length: ${meetingTitle.length} chars`)
        } else {
          console.warn(`⚠️ Title too generic (only generic word), using default: "${cleanedTitle}"`)
        }
      } else {
        console.warn(`⚠️ Title invalid (length: ${cleanedTitle?.length || 0}), using default. Raw: "${generatedTitle}"`)
        console.warn(`   Cleaned title was: "${cleanedTitle}"`)
      }
    } catch (titleError: any) {
      console.error('❌ Error generating title:', titleError)
      console.error('   Error type:', titleError?.constructor?.name || typeof titleError)
      console.error('   Error message:', titleError?.message)
      console.error('   Error stack:', titleError?.stack)
      
      // Check if it's an API key issue
      if (titleError?.message?.includes('GROQ_API_KEY') || titleError?.message?.includes('not set')) {
        console.error('   🔍 DIAGNOSIS: GROQ_API_KEY is not set in Vercel environment variables')
        console.error('   - Go to Vercel dashboard > Settings > Environment Variables')
        console.error('   - Add GROQ_API_KEY with your Groq API key')
        console.error('   - Redeploy after adding the variable')
      }
      
      // Keep the default title
      console.warn(`   Using default title: "${meetingTitle}"`)
    }

    // 4. Create meeting record
    // Add project_id if provided
    
    // Safely format the description date
    let descriptionDate = 'unknown date'
    try {
      if (session.created_at) {
        const dateObj = new Date(session.created_at)
        if (!isNaN(dateObj.getTime())) {
          descriptionDate = dateObj.toLocaleString()
        }
      }
    } catch (dateError) {
      console.warn('⚠️  Error formatting description date:', dateError)
    }
    
    // Validate scheduled_at date
    let scheduledAt = session.created_at
    if (scheduledAt) {
      try {
        const dateObj = new Date(scheduledAt)
        if (isNaN(dateObj.getTime())) {
          console.warn('⚠️  Invalid scheduled_at date, using current date')
          scheduledAt = new Date().toISOString()
        } else {
          scheduledAt = dateObj.toISOString()
        }
      } catch (dateError) {
        console.warn('⚠️  Error parsing scheduled_at, using current date:', dateError)
        scheduledAt = new Date().toISOString()
      }
    } else {
      scheduledAt = new Date().toISOString()
    }
    
    const meetingData: any = {
      title: meetingTitle,
      description: `AI-processed recording from ${descriptionDate}`,
      scheduled_at: scheduledAt,
      duration: session.duration || 0,
      recording_session_id: sessionId,
      summary: taskExtraction.summary || 'No summary available',
      action_items: taskExtraction.tasks.map(t => ({
        title: t.title || 'Untitled action item',
        description: t.description || '',
        priority: t.priority || 'medium',
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
    
    // Add project_id if provided (CRITICAL: Link meeting to project)
    if (finalProjectId) {
      meetingData.project_id = finalProjectId
      console.log(`📁 Linking meeting to project: ${finalProjectId}`)
    } else {
      console.warn(`⚠️  No projectId available - meeting and tasks will not be linked to a project`)
    }

    console.log('📝 Creating meeting with data:', {
      title: meetingData.title,
      hasSummary: !!meetingData.summary,
      actionItemsCount: meetingData.action_items.length,
      projectId: meetingData.project_id || 'none'
    })

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert(meetingData)
      .select()
      .single()

    if (meetingError) {
      console.error('❌ Error creating meeting:', meetingError)
      console.error('   Error code:', meetingError.code)
      console.error('   Error message:', meetingError.message)
      console.error('   Error details:', meetingError.details)
      console.error('   Error hint:', meetingError.hint)
      throw new Error(`Database error: ${meetingError.message} (${meetingError.code || 'unknown'})`)
    }

    console.log(`✅ Meeting created: ${meeting.id}`)

    // 5. Create tasks in tasks table
    let createdTasksCount = 0
    let tasksToCreate: any[] = []
    
    // Try to use extracted tasks first
    if (taskExtraction.tasks && taskExtraction.tasks.length > 0) {
      tasksToCreate = taskExtraction.tasks.map(task => {
        // Safely handle due_date - validate date before converting
        let dueDateISO: string | null = null
        if (task.dueDate) {
          try {
            const dateObj = new Date(task.dueDate)
            if (!isNaN(dateObj.getTime())) {
              dueDateISO = dateObj.toISOString()
            } else {
              console.warn(`⚠️  Invalid dueDate for task "${task.title}": ${task.dueDate}`)
            }
          } catch (dateError) {
            console.warn(`⚠️  Error parsing dueDate for task "${task.title}":`, dateError)
          }
        }
        
        return {
          title: task.title || 'Untitled task',
          description: task.description || 'No description',
          project_id: finalProjectId || null, // ✅ Associate with selected project
          assignee_id: task.assignee === 'User' ? userId : null,
          status: 'todo' as const,
          priority: task.priority || 'medium' as const,
          is_ai_generated: true,
          ai_priority_score: taskExtraction.confidence || 0.5,
          due_date: dueDateISO,
          estimated_hours: task.estimatedHours || null,
          tags: ['meeting-generated', `meeting:${meeting.id}`],
        }
      })
      console.log(`📋 Creating ${tasksToCreate.length} tasks from task extraction`)
      console.log(`   ✅ Project ID for tasks: ${finalProjectId || 'NONE (will not be linked to project!)'}`)
      console.log(`   Task titles:`, tasksToCreate.map(t => t.title).join(', '))
      if (!finalProjectId) {
        console.warn(`   ⚠️  WARNING: Tasks will be created without project association!`)
      }
    } else if (meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0) {
      // Fallback: Create tasks from action items if task extraction failed
      console.log(`⚠️  Task extraction returned 0, using action items as fallback`)
      tasksToCreate = meeting.action_items.map((item: any) => ({
        title: typeof item === 'string' ? item : (item.title || item.description || 'Untitled task'),
        description: typeof item === 'string' ? `From meeting: ${meeting.title}` : (item.description || `From meeting: ${meeting.title}`),
        project_id: finalProjectId || null, // ✅ CRITICAL: Associate with selected project
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
      console.log(`   ✅ Project ID for tasks: ${finalProjectId || 'NONE (will not be linked to project!)'}`)
      if (!finalProjectId) {
        console.warn(`   ⚠️  WARNING: Tasks will be created without project association!`)
      }
    } else {
      // Final fallback: Create at least one review task
      console.warn(`⚠️  No tasks or action items found, creating fallback review task`)
      tasksToCreate = [{
        title: 'Review meeting transcript and extract action items',
        description: `Review the meeting transcript and identify any action items or tasks that need to be completed. Meeting: ${meeting.title}`,
        project_id: finalProjectId || null, // ✅ CRITICAL: Associate with selected project
        assignee_id: userId,
        status: 'todo' as const,
        priority: 'medium' as const,
        is_ai_generated: true,
        ai_priority_score: 0.3,
        due_date: null,
        estimated_hours: 1,
        tags: ['meeting-generated', `meeting:${meeting.id}`, 'manual-review'],
      }]
      console.log(`📋 Creating 1 fallback review task`)
      console.log(`   ✅ Project ID for task: ${finalProjectId || 'NONE (will not be linked to project!)'}`)
      if (!finalProjectId) {
        console.warn(`   ⚠️  WARNING: Task will be created without project association!`)
      }
    }
    
    if (tasksToCreate.length > 0) {

      // ✅ CRITICAL: Log before inserting to verify project_id is set
      console.log(`📋 About to insert ${tasksToCreate.length} tasks`)
      console.log(`   Final projectId for tasks: ${finalProjectId || 'NULL - TASKS WILL NOT BE LINKED TO PROJECT!'}`)
      tasksToCreate.forEach((task, idx) => {
        console.log(`   Task ${idx + 1}: "${task.title}" → project_id: ${task.project_id || 'NULL'}`)
      })
      
      const { data: createdTasks, error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select()

      if (tasksError) {
        console.error('❌ Error creating tasks:', tasksError)
        console.error('   Error code:', tasksError.code)
        console.error('   Error message:', tasksError.message)
        console.error('   Error details:', tasksError.details)
        console.error('   Error hint:', tasksError.hint)
        console.error('   Tasks to create:', JSON.stringify(tasksToCreate, null, 2))
        console.error('   Final projectId was:', finalProjectId)
      } else {
        createdTasksCount = createdTasks?.length || 0
        console.log(`✅ Created ${createdTasksCount} tasks`)
        
        if (createdTasks && createdTasks.length > 0) {
          console.log(`   Task IDs:`, createdTasks.map((t: any) => t.id).join(', '))
          console.log(`   Task project IDs:`, createdTasks.map((t: any) => t.project_id || 'NONE').join(', '))
          
          // ✅ VERIFY: Check if any tasks have project_id set
          const tasksWithProject = createdTasks.filter((t: any) => t.project_id)
          const tasksWithoutProject = createdTasks.filter((t: any) => !t.project_id)
          console.log(`   ✅ ${tasksWithProject.length} tasks linked to project`)
          if (tasksWithoutProject.length > 0) {
            console.warn(`   ⚠️  ${tasksWithoutProject.length} tasks NOT linked to project:`, tasksWithoutProject.map((t: any) => t.id))
          }
          
          // ✅ Link tasks to meeting via meeting_tasks table
          const meetingTaskLinks = createdTasks.map((task: any) => ({
            meeting_id: meeting.id,
            task_id: task.id
          }))
          
          console.log(`📎 Linking ${meetingTaskLinks.length} tasks to meeting ${meeting.id}...`)
          console.log(`   Meeting ID: ${meeting.id}`)
          console.log(`   Links:`, JSON.stringify(meetingTaskLinks, null, 2))
          
          const { data: insertedLinks, error: linkError } = await supabase
            .from('meeting_tasks')
            .insert(meetingTaskLinks)
            .select()
          
          if (linkError) {
            console.error('❌ Error linking tasks to meeting:', linkError)
            console.error('   Error code:', linkError.code)
            console.error('   Error message:', linkError.message)
            console.error('   Error details:', linkError.details)
            console.error('   Error hint:', linkError.hint)
            console.error('   Meeting ID used:', meeting.id)
            console.error('   Task IDs to link:', meetingTaskLinks.map((l: any) => l.task_id).join(', '))
            
            // Try to verify the meeting exists
            const { data: meetingCheck, error: meetingCheckError } = await supabase
              .from('meetings')
              .select('id')
              .eq('id', meeting.id)
              .single()
            
            if (meetingCheckError) {
              console.error('   ❌ Meeting verification failed:', meetingCheckError)
            } else {
              console.log('   ✅ Meeting exists:', meetingCheck?.id)
            }
            
            // Try to verify tasks exist
            const taskIds = meetingTaskLinks.map((l: any) => l.task_id)
            const { data: tasksCheck, error: tasksCheckError } = await supabase
              .from('tasks')
              .select('id, project_id')
              .in('id', taskIds)
            
            if (tasksCheckError) {
              console.error('   ❌ Tasks verification failed:', tasksCheckError)
            } else {
              console.log(`   ✅ Verified ${tasksCheck?.length || 0} tasks exist`)
              console.log(`   Tasks with project IDs:`, tasksCheck?.map((t: any) => `${t.id} -> ${t.project_id || 'NONE'}`).join(', '))
            }
          } else {
            console.log(`✅ Successfully linked ${insertedLinks?.length || 0} tasks to meeting ${meeting.id}`)
            if (insertedLinks && insertedLinks.length > 0) {
              console.log(`   Linked task IDs:`, insertedLinks.map((l: any) => l.task_id).join(', '))
              console.log(`   Meeting ID: ${meeting.id}`)
            } else {
              console.warn(`   ⚠️  No links returned from insert (may indicate RLS blocking)`)
              console.warn(`   Attempting individual inserts as fallback...`)
              
              // ✅ Fallback: Try individual inserts if bulk insert returns empty
              let successCount = 0
              for (const link of meetingTaskLinks) {
                const { error: singleLinkError } = await supabase
                  .from('meeting_tasks')
                  .insert(link)
                
                if (singleLinkError) {
                  console.error(`   ❌ Failed to link task ${link.task_id}:`, singleLinkError.message)
                } else {
                  successCount++
                  console.log(`   ✅ Linked task ${link.task_id} to meeting ${link.meeting_id}`)
                }
              }
              console.log(`📊 Individual link fallback: ${successCount}/${meetingTaskLinks.length} successful`)
            }
          }
        } else {
          console.warn('⚠️ No tasks to link (createdTasks is empty)')
        }
      }
    }

    // 6. Mark recording as processed
    const processedAt = new Date().toISOString()
    const updatedMetadata = {
      ...(session.metadata || {}),
      meeting_id: meeting.id,
      tasks_created: createdTasksCount,
      processed_at: processedAt
    }
    
    await supabase
      .from('recording_sessions')
      .update({
        ai_processed: true,
        title: meetingTitle, // Update recording title too
        metadata: updatedMetadata
      })
      .eq('id', sessionId)

    console.log(`🎉 AI processing complete for session: ${sessionId}`)
    console.log(`📊 Final Summary:`)
    console.log(`   Meeting ID: ${meeting.id}`)
    console.log(`   Meeting Title: ${meetingTitle}`)
    console.log(`   Project ID: ${finalProjectId || 'NONE'}`)
    console.log(`   Tasks Created: ${createdTasksCount}`)
    console.log(`   Tasks Linked: ${createdTasksCount > 0 ? 'YES' : 'NO'}`)

    return NextResponse.json({
      success: true,
      meeting,
      tasksCreated: createdTasksCount,
      projectId: finalProjectId || null,
      summary: taskExtraction.summary,
      confidence: taskExtraction.confidence,
      message: `Created meeting "${meetingTitle}" with ${createdTasksCount} tasks${finalProjectId ? ` linked to project` : ' (no project association)'}`
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

