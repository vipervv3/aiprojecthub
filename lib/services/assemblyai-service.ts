/**
 * AssemblyAI Service
 * Handles audio transcription using AssemblyAI API
 */

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '0ffad391688d4276afb95b51e333ee6f'
const ASSEMBLYAI_BASE_URL = 'https://api.assemblyai.com/v2'

export interface TranscriptionResponse {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  text?: string
  confidence?: number
  words?: Array<{
    text: string
    start: number
    end: number
    confidence: number
  }>
  error?: string
}

export class AssemblyAIService {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ASSEMBLYAI_API_KEY
    
    if (!this.apiKey) {
      console.warn('AssemblyAI API key not provided')
    }
  }

  /**
   * Upload audio file to AssemblyAI
   */
  async uploadFile(audioFile: Blob | File): Promise<string> {
    try {
      const response = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'authorization': this.apiKey,
        },
        body: audioFile,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Upload failed: ${error.error || response.statusText}`)
      }

      const data = await response.json()
      return data.upload_url
    } catch (error) {
      console.error('Error uploading file to AssemblyAI:', error)
      throw error
    }
  }

  /**
   * Upload audio from URL
   */
  async uploadFromUrl(audioUrl: string): Promise<string> {
    // AssemblyAI can process URLs directly
    return audioUrl
  }

  /**
   * Create transcription job
   */
  async createTranscription(audioUrl: string, options?: {
    speaker_labels?: boolean
    auto_highlights?: boolean
    sentiment_analysis?: boolean
  }): Promise<string> {
    try {
      const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript`, {
        method: 'POST',
        headers: {
          'authorization': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speaker_labels: options?.speaker_labels ?? false,
          auto_highlights: options?.auto_highlights ?? true,
          sentiment_analysis: options?.sentiment_analysis ?? false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Transcription failed: ${error.error || response.statusText}`)
      }

      const data = await response.json()
      return data.id
    } catch (error) {
      console.error('Error creating transcription:', error)
      throw error
    }
  }

  /**
   * Get transcription status and result
   */
  async getTranscription(transcriptId: string): Promise<TranscriptionResponse> {
    try {
      const response = await fetch(`${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          'authorization': this.apiKey,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Get transcription failed: ${error.error || response.statusText}`)
      }

      const data = await response.json()
      return {
        id: data.id,
        status: data.status,
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        error: data.error,
      }
    } catch (error) {
      console.error('Error getting transcription:', error)
      throw error
    }
  }

  /**
   * Poll for transcription completion
   */
  async pollTranscription(
    transcriptId: string,
    onProgress?: (status: string) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<TranscriptionResponse> {
    let attempts = 0

    while (attempts < maxAttempts) {
      const result = await this.getTranscription(transcriptId)
      
      if (onProgress) {
        onProgress(result.status)
      }

      if (result.status === 'completed') {
        return result
      }

      if (result.status === 'error') {
        throw new Error(result.error || 'Transcription failed')
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      attempts++
    }

    throw new Error('Transcription timeout')
  }

  /**
   * Transcribe audio file (complete flow)
   */
  async transcribeFile(
    audioFile: Blob | File,
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResponse> {
    try {
      // Step 1: Upload file
      onProgress?.('Uploading audio file...')
      const audioUrl = await this.uploadFile(audioFile)

      // Step 2: Create transcription
      onProgress?.('Creating transcription job...')
      const transcriptId = await this.createTranscription(audioUrl, {
        auto_highlights: true,
      })

      // Step 3: Poll for completion
      onProgress?.('Transcribing...')
      const result = await this.pollTranscription(transcriptId, onProgress)

      return result
    } catch (error) {
      console.error('Error in transcribeFile:', error)
      throw error
    }
  }

  /**
   * Transcribe from URL (for Supabase Storage files)
   */
  async transcribeFromUrl(
    audioUrl: string,
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResponse> {
    try {
      // Step 1: Create transcription
      onProgress?.('Creating transcription job...')
      const transcriptId = await this.createTranscription(audioUrl, {
        auto_highlights: true,
      })

      // Step 2: Poll for completion
      onProgress?.('Transcribing...')
      const result = await this.pollTranscription(transcriptId, onProgress)

      return result
    } catch (error) {
      console.error('Error in transcribeFromUrl:', error)
      throw error
    }
  }
}

// Export singleton instance
export const assemblyAIService = new AssemblyAIService()

// Export for server-side use
export default AssemblyAIService




