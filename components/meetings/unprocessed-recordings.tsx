'use client'

import { useState } from 'react'
import { Mic, Brain, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface RecordingSession {
  id: string
  title: string
  duration: number
  transcription_status: string
  transcription_text?: string
  ai_processed: boolean
  created_at: string
}

interface UnprocessedRecordingsProps {
  recordings: RecordingSession[]
  userId: string
  projectId: string | null
  onProcessComplete: () => void
}

export default function UnprocessedRecordings({ 
  recordings, 
  userId,
  projectId,
  onProcessComplete 
}: UnprocessedRecordingsProps) {
  const [processing, setProcessing] = useState<Set<string>>(new Set())

  // Filter for recordings that are transcribed but not AI processed
  const unprocessedRecordings = recordings.filter(
    r => r.transcription_status === 'completed' && !r.ai_processed && r.transcription_text
  )

  const handleProcess = async (sessionId: string) => {
    setProcessing(prev => new Set(prev).add(sessionId))
    
    try {
      const response = await fetch('/api/process-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          userId,
          projectId // ✅ Pass project context
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Processing failed')
      }

      toast.success(`✅ ${result.message}`)
      onProcessComplete()
    } catch (error) {
      console.error('Processing error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process recording')
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(sessionId)
        return newSet
      })
    }
  }

  if (unprocessedRecordings.length === 0) {
    return null // Don't show section if no unprocessed recordings
  }

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-semibold text-gray-900">
          Unprocessed Recordings ({unprocessedRecordings.length})
        </h2>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800">
          <strong>🤖 AI Processing Required:</strong> These recordings have been transcribed but haven't been analyzed yet. 
          Click "Process with AI" to extract tasks, generate summaries, and create meaningful titles.
        </p>
      </div>

      <div className="space-y-3">
        {unprocessedRecordings.map((recording, index) => {
          const isProcessing = processing.has(recording.id)
          const recordingTime = format(new Date(recording.created_at), 'MMM d, yyyy h:mm a')

          return (
            <div 
              key={recording.id}
              className="card hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mic className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900">
                        {recording.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {recordingTime}
                        </span>
                        {recording.duration && (
                          <span className="text-sm text-gray-500">
                            {Math.round(recording.duration / 60)} min
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Transcribed
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleProcess(recording.id)}
                    disabled={isProcessing}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        <span>Process with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

