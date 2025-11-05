import OpenAI from 'openai'
import Groq from 'groq-sdk'
import { AssemblyAI } from 'assemblyai'
import { AI_CONFIG } from './config'

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || '',
})

export class AIService {
  private static instance: AIService
  private openai: OpenAI
  private groq: Groq
  private assemblyai: AssemblyAI

  constructor() {
    this.openai = openai
    this.groq = groq
    this.assemblyai = assemblyai
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // Primary AI analysis with fallback
  async analyzeWithFallback(prompt: string, context?: string): Promise<any> {
    // ✅ Try Groq first (fast, efficient, primary)
    try {
      // Check if Groq API key is available
      if (!process.env.GROQ_API_KEY) {
        console.error('❌ GROQ_API_KEY is not set!')
        throw new Error('GROQ_API_KEY environment variable is not set')
      }
      return await this.analyzeWithGroq(prompt, context)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorDetails = error instanceof Error ? error.stack : String(error)
      console.error('❌ Groq AI failed:', errorMessage)
      console.error('   Full error:', errorDetails)
      console.warn('   Trying OpenAI fallback...')
      try {
        return await this.analyzeWithOpenAI(prompt, context)
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        console.error('❌ All AI services failed!')
        console.error('   Groq error:', errorMessage)
        console.error('   OpenAI error:', fallbackMessage)
        throw new Error(`AI analysis unavailable: Groq(${errorMessage}), OpenAI(${fallbackMessage})`)
      }
    }
  }

  // OpenAI analysis
  async analyzeWithOpenAI(prompt: string, context?: string): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: AI_CONFIG.models.openai.chat,
      messages: [
        {
          role: 'system',
          content: context || 'You are an AI assistant helping with project management and task analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: AI_CONFIG.limits.maxTokens,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content
  }

  // Groq analysis (faster inference)
  async analyzeWithGroq(prompt: string, context?: string): Promise<any> {
    const response = await this.groq.chat.completions.create({
      model: AI_CONFIG.models.groq.chat,
      messages: [
        {
          role: 'system',
          content: context || 'You are an AI assistant helping with project management and task analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: AI_CONFIG.limits.maxTokens,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content
  }

  // Transcription with AssemblyAI (primary) and OpenAI Whisper (fallback)
  async transcribeAudio(audioBuffer: Buffer): Promise<{
    text: string
    confidence: number
    provider: string
  }> {
    try {
      return await this.transcribeWithAssemblyAI(audioBuffer)
    } catch (error) {
      console.warn('AssemblyAI transcription failed, trying Whisper:', error)
      try {
        return await this.transcribeWithWhisper(audioBuffer)
      } catch (fallbackError) {
        console.error('All transcription services failed:', fallbackError)
        throw new Error('Transcription unavailable')
      }
    }
  }

  // AssemblyAI transcription
  async transcribeWithAssemblyAI(audioBuffer: Buffer): Promise<{
    text: string
    confidence: number
    provider: string
  }> {
    // Upload file to AssemblyAI
    const uploadUrl = await this.assemblyai.files.upload(audioBuffer)
    
    // Create transcript
    const transcript = await this.assemblyai.transcripts.transcribe({
      audio: uploadUrl,
      speaker_labels: true,
      sentiment_analysis: true,
      entity_detection: true,
      summarization: true,
      summary_type: 'bullets'
    })

    return {
      text: transcript.text || '',
      confidence: transcript.confidence || 0.8,
      provider: 'assemblyai'
    }
  }

  // OpenAI Whisper transcription
  async transcribeWithWhisper(audioBuffer: Buffer): Promise<{
    text: string
    confidence: number
    provider: string
  }> {
    const audioFile = new File([new Uint8Array(audioBuffer)], 'audio.mp3', { type: 'audio/mp3' })
    
    const response = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: AI_CONFIG.models.openai.transcription,
      response_format: 'verbose_json',
      temperature: 0.0,
    })

    return {
      text: response.text || '',
      confidence: 0.9, // Whisper doesn't provide confidence scores
      provider: 'whisper'
    }
  }

  // Intelligent task extraction
  async extractTasksFromText(text: string, context?: string): Promise<{
    tasks: Array<{
      title: string
      description: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      estimatedHours?: number
      dueDate?: Date
      assignee?: string
    }>
    summary: string
    confidence: number
  }> {
    // Truncate text if too long (keep first 8000 chars to avoid token limits)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) + '...' : text
    
    const prompt = `You are an expert task extraction AI. Analyze this meeting transcript and extract ALL actionable tasks, action items, to-dos, and commitments.

CRITICAL INSTRUCTIONS:
- Look for ANY mention of things to do, follow up on, or complete
- Extract tasks even if they're mentioned casually (e.g., "we should...", "I'll...", "let's...")
- Each task MUST have a clear title and description
- If someone commits to doing something, that's a task
- Look for deadlines, dates, and priorities mentioned
- Extract at least 1-3 tasks if the meeting discussed any work or planning

Examples of task indicators:
- "I will..." / "We will..." / "Let's..."
- "Need to..." / "Should..." / "Must..."
- "Follow up on..." / "Review..." / "Check..."
- "Complete by..." / "Finish..."
- Any deadline or due date mentioned
- Any action item mentioned explicitly

Meeting Transcript:
${truncatedText}

${context ? `Project Context: ${context}` : ''}

Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{
  "tasks": [
    {
      "title": "Clear, specific task title (max 100 chars)",
      "description": "Detailed description of what needs to be done, why, and any context",
      "priority": "medium",
      "estimatedHours": 2,
      "dueDate": "2025-11-15",
      "assignee": "Name if mentioned, otherwise null"
    }
  ],
  "summary": "2-3 sentence summary of the meeting's main points and outcomes",
  "confidence": 0.85
}

IMPORTANT: If the transcript contains ANY discussion of work, planning, or follow-ups, extract at least 1 task. Only return empty array if truly nothing actionable was discussed.`

    let response = ''
    try {
      console.log(`🔍 Extracting tasks from transcript (${text.length} chars)...`)
      response = await this.analyzeWithFallback(prompt, context)
      console.log('🤖 Raw AI response (first 500 chars):', response?.substring(0, 500))
      
      // Clean up response - remove markdown code blocks if present
      let cleanResponse = response.trim()
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim()
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim()
      }
      
      // Try to extract JSON if wrapped in other text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanResponse = jsonMatch[0]
      }
      
      const parsed = JSON.parse(cleanResponse)
      
      // Validate response structure
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        console.error('❌ Invalid response structure - no tasks array')
        console.error('   Parsed object:', JSON.stringify(parsed, null, 2))
        return {
          tasks: [],
          summary: parsed.summary || 'Task extraction returned invalid format',
          confidence: 0
        }
      }
      
      // Filter out invalid tasks
      const validTasks = parsed.tasks.filter((task: any) => 
        task && 
        typeof task === 'object' && 
        task.title && 
        typeof task.title === 'string' && 
        task.title.trim().length > 0
      )
      
      if (validTasks.length === 0 && parsed.tasks.length > 0) {
        console.warn('⚠️ All extracted tasks were invalid, using fallback')
        // Try to create at least one task from the summary
        if (parsed.summary && parsed.summary.trim().length > 0) {
          validTasks.push({
            title: 'Review meeting summary and follow up',
            description: parsed.summary.substring(0, 200),
            priority: 'medium',
            estimatedHours: 1
          })
        }
      }
      
      console.log(`✅ Extracted ${validTasks.length} valid tasks from ${parsed.tasks.length} total`)
      if (validTasks.length > 0) {
        console.log('   Task titles:', validTasks.map((t: any) => t.title).join(', '))
      }
      
      return {
        tasks: validTasks,
        summary: parsed.summary || 'Meeting summary',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7
      }
    } catch (error) {
      console.error('❌ Task extraction failed:', error)
      console.error('   Error type:', error?.constructor?.name)
      console.error('   Response was:', response?.substring(0, 500))
      
      // Try to extract at least a summary task as fallback
      let fallbackSummary = 'Task extraction failed. Please review the transcript manually.'
      if (text && text.length > 50) {
        fallbackSummary = `Review meeting transcript: ${text.substring(0, 150)}...`
      }
      
      return {
        tasks: [{
          title: 'Review meeting transcript and extract action items',
          description: fallbackSummary,
          priority: 'medium',
          estimatedHours: 1
        }],
        summary: 'Please review the transcript to identify action items manually.',
        confidence: 0.3
      }
    }
  }

  // AI insights generation
  async generateProjectInsights(projectData: any): Promise<{
    insights: Array<{
      type: string
      title: string
      description: string
      priority: 'low' | 'medium' | 'high' | 'urgent'
      actionable: boolean
      confidence: number
    }>
    overallHealth: number
  }> {
    const prompt = `
    Analyze the following project data and generate insights:

    Project: ${JSON.stringify(projectData, null, 2)}

    Provide insights about:
    - Productivity trends
    - Team efficiency
    - Burnout risk
    - Deadline risks
    - Resource allocation
    - Process improvements

    Return as JSON:
    {
      "insights": [
        {
          "type": "productivity",
          "title": "Insight title",
          "description": "Detailed description",
          "priority": "medium",
          "actionable": true,
          "confidence": 0.8
        }
      ],
      "overallHealth": 0.75
    }
    `

    try {
      const response = await this.analyzeWithFallback(prompt)
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      console.error('Insight generation failed:', error)
      return {
        insights: [],
        overallHealth: 0.5
      }
    }
  }

  // Smart notification content generation
  async generateNotificationContent(userData: any, notificationType: string): Promise<{
    title: string
    message: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    actionable: boolean
  }> {
    const prompt = `
    Generate personalized notification content for a project management user.

    User Data: ${JSON.stringify(userData, null, 2)}
    Notification Type: ${notificationType}

    Create engaging, actionable content that:
    - Is personalized to their current projects and tasks
    - Provides clear value and next steps
    - Uses an encouraging, professional tone
    - Highlights important deadlines or opportunities

    Return as JSON:
    {
      "title": "Notification title",
      "message": "Detailed notification message",
      "priority": "medium",
      "actionable": true
    }
    `

    try {
      const response = await this.analyzeWithFallback(prompt)
      const parsed = JSON.parse(response)
      return parsed
    } catch (error) {
      console.error('Notification content generation failed:', error)
      return {
        title: 'Daily Update',
        message: 'Check your projects and tasks for today.',
        priority: 'medium',
        actionable: true
      }
    }
  }
}

export const aiService = AIService.getInstance()


