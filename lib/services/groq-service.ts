/**
 * Groq AI Service
 * Handles AI-powered task generation from meeting transcripts
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const GROQ_MODEL = 'llama-3.3-70b-versatile' // Latest stable model (Dec 2024)

export interface ExtractedTask {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  estimated_hours?: number
}

export interface MeetingSummary {
  summary: string
  keyPoints: string[]
  tasks: ExtractedTask[]
  actionItems: string[]
}

export class GroqService {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || GROQ_API_KEY
    this.model = model || GROQ_MODEL
    
    if (!this.apiKey) {
      console.warn('Groq API key not provided')
    }
    
    console.log('Groq Service initialized with model:', this.model)
  }

  /**
   * Make a chat completion request to Groq with retry logic
   */
  private async chat(messages: Array<{ role: string; content: string }>, temperature: number = 0.3, retries: number = 2): Promise<string> {
    let lastError: any = null
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt}/${retries}`)
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
        
        console.log('Calling Groq API with model:', this.model)
        const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature,
            max_tokens: 4000,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Groq API error:', error)
          
          // Handle rate limit errors - retry after waiting
          if (error.error?.message?.includes('Rate limit') || error.error?.message?.includes('rate limit')) {
            console.log('Rate limit hit, will retry...')
            lastError = new Error(`Rate limit: ${error.error?.message}`)
            continue // Retry
          }
          
          // Try fallback model if current model is deprecated
          if (error.error?.message?.includes('deprecated') || error.error?.message?.includes('not found')) {
            console.log('Model deprecated, trying fallback: llama-3.3-70b-specdec')
            this.model = 'llama-3.3-70b-specdec'
            
            const fallbackResponse = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: this.model,
                messages,
                temperature,
                max_tokens: 4000,
              }),
            })
            
            if (!fallbackResponse.ok) {
              const fallbackError = await fallbackResponse.json()
              throw new Error(`Groq API error: ${fallbackError.error?.message || fallbackResponse.statusText}`)
            }
            
            const fallbackData = await fallbackResponse.json()
            console.log('Fallback model worked!')
            return fallbackData.choices[0]?.message?.content || ''
          }
          
          throw new Error(`Groq API error: ${error.error?.message || response.statusText}`)
        }

        const data = await response.json()
        console.log('Groq API response received')
        return data.choices[0]?.message?.content || ''
      } catch (error) {
        lastError = error
        if (attempt === retries) {
          console.error(`All retry attempts failed:`, error)
          throw error
        }
      }
    }
    
    throw lastError
  }

  /**
   * Extract tasks from meeting transcript
   */
  async extractTasks(transcript: string, projectContext?: string): Promise<ExtractedTask[]> {
    try {
      const today = new Date()
      const sevenDaysLater = new Date(today)
      sevenDaysLater.setDate(today.getDate() + 7)
      const defaultDueDate = sevenDaysLater.toISOString().split('T')[0]
      
      const systemPrompt = `You are an expert at analyzing meeting transcripts and extracting actionable tasks.
Your job is to identify clear action items, to-dos, and commitments from the conversation.

IMPORTANT DATE RULES:
- Today's date is: ${today.toISOString().split('T')[0]}
- If NO due date is mentioned in transcript, use: ${defaultDueDate} (7 days from today)
- If a due date IS mentioned, calculate it relative to TODAY (${today.toISOString().split('T')[0]})
- ALWAYS use year ${today.getFullYear()} or later, NEVER use past years like 2024
- Format dates as: YYYY-MM-DD

For each task you extract, determine:
1. A clear, concise title (max 80 characters)
2. A detailed description of what needs to be done
3. Priority level: low, medium, high, or urgent
4. Estimated hours if mentioned or can be inferred (default: 2)
5. Due date: Use ${defaultDueDate} if not mentioned, or calculate from transcript if mentioned

Return ONLY a valid JSON array of tasks, no other text. Format:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "priority": "medium",
    "estimated_hours": 2,
    "due_date": "${defaultDueDate}"
  }
]

If no clear tasks are found, return an empty array: []`

      const userPrompt = projectContext
        ? `Project Context: ${projectContext}\n\nMeeting Transcript:\n${transcript}`
        : `Meeting Transcript:\n${transcript}`

      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])

      // Parse JSON response (handle markdown code blocks and extra text)
      try {
        let cleanResponse = response.trim()
        
        // Remove markdown code blocks if present
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '')
        
        // Extract just the JSON array if there's extra text
        // Look for [...] pattern
        const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          cleanResponse = arrayMatch[0]
        }
        
        const tasks = JSON.parse(cleanResponse)
        return Array.isArray(tasks) ? tasks : []
      } catch (parseError) {
        console.error('Error parsing task JSON:', parseError)
        console.log('Raw response:', response)
        return []
      }
    } catch (error) {
      console.error('Error extracting tasks:', error)
      throw error
    }
  }

  /**
   * Generate meeting title from transcript
   */
  async generateMeetingTitle(transcript: string): Promise<string> {
    try {
      const systemPrompt = `Generate a concise, descriptive meeting title (max 60 characters) from this transcript.
The title should capture the main topic or purpose of the meeting.

Return ONLY the title text, no quotes, no JSON, just the plain title.

Examples:
- "Q4 Product Roadmap Planning"
- "Bug Fix Discussion - Login Issue"
- "Sprint Planning - Week 42"
- "Customer Feedback Review"
`

      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Meeting Transcript:\n${transcript.substring(0, 1000)}` } // First 1000 chars
      ], 0.5)

      const title = response.trim().replace(/^["']|["']$/g, '') // Remove quotes if present
      return title.substring(0, 60) // Ensure max 60 chars
    } catch (error) {
      console.error('Error generating title:', error)
      return 'Meeting Recording' // Fallback
    }
  }

  /**
   * Generate meeting summary
   */
  async generateSummary(transcript: string): Promise<MeetingSummary> {
    try {
      const systemPrompt = `You are an expert at summarizing meeting transcripts.
Create a concise summary with key points and action items.

Return ONLY valid JSON in this format:
{
  "summary": "2-3 sentence overview of the meeting",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2"]
}

Keep it concise and actionable.`

      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Meeting Transcript:\n${transcript}` }
      ])

      // Parse JSON response (handle markdown code blocks)
      try {
        let cleanResponse = response.trim()
        
        // Remove markdown code blocks if present
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '')
        
        const summary = JSON.parse(cleanResponse)
        
        // Extract tasks from action items
        const tasks = await this.extractTasks(transcript)
        
        return {
          summary: summary.summary || '',
          keyPoints: summary.keyPoints || [],
          tasks: tasks,
          actionItems: summary.actionItems || [],
        }
      } catch (parseError) {
        console.error('Error parsing summary JSON:', parseError)
        console.log('Raw response:', response)
        return {
          summary: 'Error generating summary',
          keyPoints: [],
          tasks: [],
          actionItems: [],
        }
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      throw error
    }
  }

  /**
   * Analyze meeting sentiment and insights
   */
  async analyzeSentiment(transcript: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    confidence: number
    insights: string[]
  }> {
    try {
      const systemPrompt = `Analyze the sentiment and key insights from this meeting transcript.

Return ONLY valid JSON:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "insights": ["insight 1", "insight 2"]
}`

      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ], 0.5)

      let cleanResponse = response.trim()
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      return JSON.parse(cleanResponse)
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
      return {
        sentiment: 'neutral',
        confidence: 0,
        insights: [],
      }
    }
  }

  /**
   * Complete meeting analysis (summary + tasks)
   */
  async analyzeTranscript(
    transcript: string,
    projectContext?: string
  ): Promise<{
    summary: MeetingSummary
    tasks: ExtractedTask[]
  }> {
    try {
      // Run summary and task extraction in parallel
      const [summary, tasks] = await Promise.all([
        this.generateSummary(transcript),
        this.extractTasks(transcript, projectContext),
      ])

      return {
        summary,
        tasks,
      }
    } catch (error) {
      console.error('Error analyzing transcript:', error)
      throw error
    }
  }
}

// Export singleton instance
export const groqService = new GroqService()

// Export for server-side use
export default GroqService

