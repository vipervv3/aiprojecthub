export const AI_CONFIG = {
  providers: {
    primary: 'groq',        // ✅ Groq is primary (fast & efficient)
    secondary: 'openai',    // OpenAI as fallback if needed
    transcription: 'assemblyai',
    fallback: 'openai-whisper',
    embedding: 'openai-ada-002'
  },
  models: {
    openai: {
      chat: 'gpt-4-turbo-preview',
      transcription: 'whisper-1',
      embedding: 'text-embedding-ada-002'
    },
    groq: {
      chat: 'llama-3.1-70b-versatile',  // ✅ Better quality for task extraction and title generation
      fast: 'llama-3.1-8b-instant',      // Fast fallback option
      alt: 'mixtral-8x7b-32768'
    },
    assemblyai: {
      model: 'best'
    }
  },
  thresholds: {
    confidence: 0.8,
    urgency: 0.7,
    priority: 0.6
  },
  limits: {
    maxTokens: 4000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxDuration: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    retryAttempts: 3
  }
} as const

export type AIProvider = keyof typeof AI_CONFIG.providers
export type AIModel = keyof typeof AI_CONFIG.models.openai






















