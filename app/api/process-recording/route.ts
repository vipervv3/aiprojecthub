import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AIService } from '@/lib/ai/services'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

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
      
      // If no tasks extracted, try harder to extract from summary or transcript
      if (taskExtraction.tasks.length === 0) {
        console.warn('⚠️ No tasks extracted, attempting to extract from transcript using pattern matching')
        
        // Try to find action items in the full transcript (not just summary)
        const searchText = transcriptionText.length > 2000 
          ? transcriptionText.substring(0, 2000) + ' ' + taskExtraction.summary 
          : transcriptionText + ' ' + (taskExtraction.summary || '')
        
        // Improved patterns that capture complete phrases
        const actionPatterns = [
          /(?:need to|should|must|will|going to|plan to|gonna|let's|we'll)\s+(?:do|implement|create|build|fix|complete|finish|review|check|follow up on|work on|discuss)\s+([^.!?\n]{15,120})/gi,
          /(?:action item|task|todo|follow.?up|action):\s*(?:is|will be|to)\s*([^.!?\n]{15,120})/gi,
          /(?:complete|finish|do|implement|create|build|fix|review|check)\s+(?:the|this|that|a|an)\s+([^.!?\n]{15,120})/gi,
          /(?:i'll|i will|we'll|we will)\s+(?:do|complete|finish|implement|create|build|fix|review|check|work on)\s+([^.!?\n]{15,120})/gi
        ]
        
        const foundActions: Set<string> = new Set() // Use Set to avoid duplicates
        
        actionPatterns.forEach(pattern => {
          const matches = searchText.matchAll(pattern)
          for (const match of matches) {
            if (match[1]) {
              let action = match[1].trim()
              // Clean up the extracted action
              action = action.replace(/^(the|this|that|a|an)\s+/i, '')
              action = action.replace(/\s+(the|this|that|a|an)$/i, '')
              // Ensure complete phrase (not cut off mid-word)
              action = action.replace(/\s+\w{1,2}$/, '') // Remove trailing 1-2 char words
              
              if (action.length >= 15 && action.length <= 120) {
                // Check for duplicate or very similar actions
                const isDuplicate = Array.from(foundActions).some(existing => 
                  existing.toLowerCase().includes(action.toLowerCase().substring(0, 20)) ||
                  action.toLowerCase().includes(existing.toLowerCase().substring(0, 20))
                )
                if (!isDuplicate) {
                  foundActions.add(action)
                }
              }
            }
          }
        })
        
        if (foundActions.size > 0) {
          console.log(`✅ Found ${foundActions.size} potential tasks from patterns`)
          taskExtraction.tasks = Array.from(foundActions).slice(0, 5).map((action) => {
            // Create a proper title (first 80 chars at word boundary)
            let title = action.substring(0, 80)
            if (title.length === 80 && action.length > 80) {
              const lastSpace = title.lastIndexOf(' ')
              title = lastSpace > 20 ? title.substring(0, lastSpace) : title
            }
            title = title.charAt(0).toUpperCase() + title.slice(1)
            
            return {
              title: title,
              description: `Action item extracted from meeting transcript: ${action.substring(0, 200)}`,
              priority: 'medium' as const,
              estimatedHours: 1
            }
          })
        } else {
          console.warn('⚠️ No action patterns found, no tasks will be created')
          taskExtraction.tasks = []
        }
      }
      
      if (!taskExtraction.summary || taskExtraction.summary.length < 50) {
        console.warn('⚠️ Task extraction summary is missing or too short, generating from transcript')
        // Extract first 2-3 meaningful sentences for summary
        const sentences = transcriptionText.split(/[.!?]\s+/).filter(s => {
          const trimmed = s.trim()
          return trimmed.length > 20 && trimmed.split(/\s+/).length >= 4
        })
        
        if (sentences.length > 0) {
          taskExtraction.summary = sentences.slice(0, 3).join('. ').trim()
          if (taskExtraction.summary.length > 400) {
            taskExtraction.summary = taskExtraction.summary.substring(0, 397) + '...'
          }
        } else {
          // Fallback to first 300 chars if no good sentences found
          taskExtraction.summary = transcriptionText.length > 300 
            ? `${transcriptionText.substring(0, 297).trim()}...`
            : transcriptionText.trim()
        }
      }
      
      if (typeof taskExtraction.confidence !== 'number') {
        taskExtraction.confidence = 0.5
      }
    } catch (extractionError: any) {
      console.error('❌ Error extracting tasks:', extractionError)
      console.error('   Error details:', extractionError?.message || extractionError)
      // No fallback tasks - only create tasks if AI successfully extracts them
      taskExtraction = {
        tasks: [],
        summary: transcriptionText.length > 300 
          ? `${transcriptionText.substring(0, 300)}...`
          : transcriptionText,
        confidence: 0.0
      }
      console.warn('⚠️ Task extraction failed - no tasks will be created')
    }

    // 3. Generate meaningful meeting title using improved prompt
    // Start with a default, but try to extract something meaningful from transcript first
    let meetingTitle = session.title || `Recording - ${new Date(session.created_at).toLocaleDateString()}`
    
    // Quick fallback: Extract first meaningful phrase from transcript as title
    const extractFallbackTitle = (text: string): string | null => {
      if (!text || text.length < 20) return null
      
      // Try to find key phrases that indicate meeting topics - ensure complete words
      const topicPatterns = [
        /(?:discussing|talking about|meeting about|planning|reviewing|working on)\s+([^.!?]{10,80})/i,
        /(?:agenda|topic|subject|focus|purpose)\s+(?:is|for|about)\s+([^.!?]{10,80})/i,
        /(?:let's|we'll|we're|going to|need to)\s+(?:discuss|talk about|review|plan|work on)\s+([^.!?]{10,80})/i
      ]
      
      for (const pattern of topicPatterns) {
        const match = text.match(pattern)
        if (match && match[1]) {
          let title = match[1].trim()
          // Remove common prefixes and filler words
          title = title.replace(/^(so|well|okay|alright|yes|no|ok|um|uh|like|you know|the|a|an),?\s*/i, '')
          // Remove trailing incomplete words (ensure we end at word boundary)
          title = title.replace(/\s+\w*$/, '')
          // Capitalize first letter
          title = title.charAt(0).toUpperCase() + title.slice(1)
          // Limit to 50 chars and ensure it ends at a word boundary (not mid-word)
          if (title.length > 50) {
            const truncated = title.substring(0, 47).trim()
            const lastSpace = truncated.lastIndexOf(' ')
            // Only truncate at word boundary if it's not too short
            title = lastSpace > 10 ? truncated.substring(0, lastSpace) : truncated.substring(0, 50)
          }
          // Ensure title doesn't end mid-word or mid-sentence
          if (title.length >= 8 && title.length <= 50) {
            return title
          }
        }
      }
      
      // Fallback: Try to find first complete sentence that's meaningful
      const sentences = text.split(/[.!?]\s+/).filter(s => {
        const trimmed = s.trim()
        return trimmed.length > 15 && trimmed.length < 150 && 
               !trimmed.match(/^(okay|yes|no|um|uh|so|well)\s*$/i) &&
               trimmed.split(/\s+/).length >= 3 // At least 3 words
      })
      
      if (sentences.length > 0) {
        let title = sentences[0].trim()
        // Remove common prefixes
        title = title.replace(/^(so|well|okay|alright|yes|no|ok|um|uh|like|you know|the|a|an),?\s*/i, '')
        // Capitalize first letter
        title = title.charAt(0).toUpperCase() + title.slice(1)
        // Limit to 50 chars at word boundary (never cut mid-word)
        if (title.length > 50) {
          const truncated = title.substring(0, 47).trim()
          const lastSpace = truncated.lastIndexOf(' ')
          // Only truncate at word boundary
          title = lastSpace > 10 ? truncated.substring(0, lastSpace) : title.substring(0, 50).replace(/\s+\w*$/, '')
        }
        // Final check - ensure it's a complete phrase
        if (title.length >= 8 && title.length <= 50 && !title.match(/\s+\w{1,2}$/)) {
          return title
        }
      }
      return null
    }
    
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
      
      // Use more transcript for better context (first 4000 chars instead of 2000)
      const transcriptExcerpt = transcriptionText.substring(0, 4000)
      
      const titlePrompt = `You are an expert meeting title generator. Analyze this meeting transcript and generate a VERY SHORT, intelligent title that summarizes the ENTIRE meeting.

CRITICAL REQUIREMENTS:
- Title must be 3-8 words (8-50 characters) - VERY SHORT overview
- Capture the MAIN topic or purpose of the ENTIRE meeting in just a few words
- Think of it as a headline or topic summary, not a description
- Be specific and meaningful (not generic like "Meeting" or "Recording")
- Focus on WHAT the meeting was about overall, not specific tasks or details
- Use professional, business-appropriate language
- Do NOT use task titles or action item titles
- Do NOT include quotes, colons, or any prefixes
- Return ONLY the title text, nothing else

${titleContext}Meeting Transcript:
${transcriptExcerpt}

Examples of EXCELLENT titles (very short, intelligent overviews):
- "Q4 Roadmap Planning" (3 words - captures main topic)
- "Front Office Summit Planning" (3 words - clear purpose)
- "Sprint Planning - Backend API" (4 words - concise and specific)
- "Customer Feedback Review" (3 words - clear focus)
- "Team Standup Updates" (3 words - brief and meaningful)
- "Product Launch Strategy" (3 words - clear topic)
- "Budget Approval Discussion" (3 words - specific purpose)

BAD examples (too long, too generic, or task-focused):
- "Finalize FNB food for Front Office Summit" ❌ (too long, task-focused)
- "Meeting about planning and discussing things" ❌ (too generic)
- "Review meeting summary and follow up" ❌ (task-focused)
- "Recording" ❌ (too generic)
- "Team Meeting" ❌ (too vague)

Generate ONLY a very short title (3-8 words, no quotes, no JSON, no explanation):`

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
        .replace(/\n.*/g, '') // Remove any newlines and everything after first line
        .split(/[.!?]/)[0] // Only take first sentence (stop at punctuation)
        .replace(/^[^a-zA-Z0-9]+/, '') // Remove leading non-alphanumeric
        .trim()
      
      // Ensure we don't cut mid-word - truncate at word boundary
      if (cleanedTitle.length > 50) {
        const truncated = cleanedTitle.substring(0, 47).trim()
        const lastSpace = truncated.lastIndexOf(' ')
        // Only truncate at word boundary if there's a space
        cleanedTitle = lastSpace > 10 ? truncated.substring(0, lastSpace) : truncated
      }
      
      // Remove trailing incomplete words or punctuation
      cleanedTitle = cleanedTitle.replace(/\s+\w{1,2}$/, '') // Remove trailing 1-2 char words
      cleanedTitle = cleanedTitle.replace(/[^a-zA-Z0-9]+$/, '') // Remove trailing non-alphanumeric
      cleanedTitle = cleanedTitle.trim()
      
      // ✅ Accept titles that are 8-50 characters (very short to medium length)
      // This allows for 3-8 word titles which is what we want
      if (cleanedTitle && cleanedTitle.length >= 8 && cleanedTitle.length <= 50) {
        const genericWords = ['meeting', 'recording', 'call', 'conversation', 'discussion', 'team meeting', 'business meeting']
        const lowerTitle = cleanedTitle.toLowerCase().trim()
        
        // Check if title is ONLY generic words (reject these)
        const words = lowerTitle.split(/\s+/)
        const isOnlyGeneric = words.length <= 2 && words.every(word => genericWords.includes(word))
        
        if (!isOnlyGeneric) {
          meetingTitle = cleanedTitle
          console.log(`✅ Generated intelligent title: "${meetingTitle}"`)
          console.log(`   Title length: ${meetingTitle.length} chars`)
          console.log(`   Word count: ${cleanedTitle.split(/\s+/).length} words`)
        } else {
          console.warn(`⚠️ Title is only generic words, trying fallback: "${cleanedTitle}"`)
          // Try fallback
          const fallbackTitle = extractFallbackTitle(transcriptionText)
          if (fallbackTitle && fallbackTitle.length >= 8) {
            meetingTitle = fallbackTitle.substring(0, 50)
            console.log(`✅ Using fallback title: "${meetingTitle}"`)
          }
        }
      } else if (cleanedTitle && cleanedTitle.length > 0) {
        // If length is slightly off, try to fix it
        if (cleanedTitle.length > 50) {
          // Truncate long titles but preserve word boundaries
          const truncated = cleanedTitle.substring(0, 47).trim()
          const lastSpace = truncated.lastIndexOf(' ')
          meetingTitle = lastSpace > 30 ? truncated.substring(0, lastSpace) : truncated
          console.log(`✅ Using truncated title: "${meetingTitle}"`)
        } else if (cleanedTitle.length >= 5) {
          // Accept very short titles if they're meaningful (not just generic words)
          const lowerTitle = cleanedTitle.toLowerCase().trim()
          const genericWords = ['meeting', 'recording', 'call']
          if (!genericWords.includes(lowerTitle)) {
            meetingTitle = cleanedTitle
            console.log(`✅ Using short but meaningful title: "${meetingTitle}"`)
          } else {
            console.warn(`⚠️ Title too generic (${cleanedTitle.length} chars), trying fallback`)
            const fallbackTitle = extractFallbackTitle(transcriptionText)
            if (fallbackTitle && fallbackTitle.length >= 8) {
              meetingTitle = fallbackTitle.substring(0, 50)
              console.log(`✅ Using fallback title: "${meetingTitle}"`)
            }
          }
        } else {
          console.warn(`⚠️ Title too short (${cleanedTitle.length} chars), trying fallback. Raw: "${generatedTitle}"`)
          const fallbackTitle = extractFallbackTitle(transcriptionText)
          if (fallbackTitle && fallbackTitle.length >= 8) {
            meetingTitle = fallbackTitle.substring(0, 50)
            console.log(`✅ Using fallback title: "${meetingTitle}"`)
          }
        }
      } else {
        console.warn(`⚠️ Title empty or invalid, using fallback. Raw: "${generatedTitle}"`)
        console.warn(`   Cleaned title was: "${cleanedTitle}"`)
        
        // Try fallback extraction from transcript
        const fallbackTitle = extractFallbackTitle(transcriptionText)
        if (fallbackTitle && fallbackTitle.length >= 8) {
          meetingTitle = fallbackTitle.substring(0, 50)
          console.log(`✅ Using fallback title from transcript: "${meetingTitle}"`)
        }
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
      
      // Try fallback extraction from transcript
      const fallbackTitle = extractFallbackTitle(transcriptionText)
      if (fallbackTitle && fallbackTitle.length >= 10) {
        meetingTitle = fallbackTitle
        console.log(`✅ Using fallback title from transcript: "${meetingTitle}"`)
      } else {
        console.warn(`   Using default title: "${meetingTitle}"`)
      }
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
      user_id: userId, // ✅ CRITICAL: Set user_id for RLS policies
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
    
    console.log(`👤 Meeting user_id: ${userId}`)

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
    let createdTaskIds: string[] = [] // Store task IDs for verification
    
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
        
        // ✅ Automatically set due date to 7 days from now if not provided
        if (!dueDateISO) {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 7) // Add 7 days
          dueDateISO = dueDate.toISOString()
          console.log(`📅 Auto-assigned due date (7 days) for task "${task.title}": ${dueDateISO}`)
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
    } else {
      // No tasks extracted - do not create any mock/fallback tasks
      console.log(`ℹ️  No tasks extracted from recording - meeting will be created without tasks`)
      tasksToCreate = []
    }
    
    if (tasksToCreate.length > 0) {

      // ✅ DEDUPLICATE: Remove duplicate tasks by title (case-insensitive)
      const seenTitles = new Set<string>()
      tasksToCreate = tasksToCreate.filter(task => {
        const titleKey = (task.title || '').toLowerCase().trim()
        if (titleKey && seenTitles.has(titleKey)) {
          console.warn(`⚠️  Duplicate task filtered out: "${task.title}"`)
          return false
        }
        if (titleKey) {
          seenTitles.add(titleKey)
        }
        return true
      })
      console.log(`📋 After deduplication: ${tasksToCreate.length} unique tasks`)

      // ✅ CHECK EXISTING: Verify tasks don't already exist for this project
      if (finalProjectId && tasksToCreate.length > 0) {
        const taskTitles = tasksToCreate.map(t => t.title?.toLowerCase().trim()).filter(Boolean)
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('project_id', finalProjectId)
          .in('title', taskTitles)
        
        if (existingTasks && existingTasks.length > 0) {
          const existingTitles = new Set(existingTasks.map(t => t.title?.toLowerCase().trim()))
          const beforeCount = tasksToCreate.length
          tasksToCreate = tasksToCreate.filter(task => {
            const titleKey = task.title?.toLowerCase().trim()
            if (titleKey && existingTitles.has(titleKey)) {
              console.warn(`⚠️  Task already exists, skipping: "${task.title}"`)
              return false
            }
            return true
          })
          console.log(`📋 After checking existing: ${tasksToCreate.length} new tasks (${beforeCount - tasksToCreate.length} already exist)`)
        }
      }

      // ✅ CRITICAL: Ensure project_id is set on ALL tasks before inserting
      if (finalProjectId) {
        tasksToCreate = tasksToCreate.map(task => ({
          ...task,
          project_id: finalProjectId // Force set project_id
        }))
        console.log(`✅ FORCED project_id=${finalProjectId} on all ${tasksToCreate.length} tasks`)
      }
      
      // ✅ CRITICAL: Log before inserting to verify project_id is set
      console.log(`📋 About to insert ${tasksToCreate.length} tasks`)
      console.log(`   Final projectId for tasks: ${finalProjectId || 'NULL - TASKS WILL NOT BE LINKED TO PROJECT!'}`)
      tasksToCreate.forEach((task, idx) => {
        console.log(`   Task ${idx + 1}: "${task.title}" → project_id: ${task.project_id || 'NULL'}`)
        if (!task.project_id && finalProjectId) {
          console.error(`   ❌ ERROR: Task ${idx + 1} has NULL project_id despite finalProjectId being set!`)
        }
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
          // Store task IDs for verification outside this block
          createdTaskIds = createdTasks.map((t: any) => t.id)
          
          console.log(`   Task IDs:`, createdTaskIds.join(', '))
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

    // Get actual task data to verify project_id
    let actualTasks: any[] = []
    if (createdTasksCount > 0 && createdTaskIds.length > 0) {
      const { data: verifiedTasks } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .in('id', createdTaskIds)
      
      actualTasks = verifiedTasks || []
      console.log(`🔍 Verified tasks after creation:`)
      actualTasks.forEach((t: any) => {
        console.log(`   Task "${t.title}" (${t.id}): project_id = ${t.project_id || 'NULL'}`)
      })
    }
    
    return NextResponse.json({
      success: true,
      meeting,
      tasksCreated: createdTasksCount,
      tasks: actualTasks, // Include task details in response
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

