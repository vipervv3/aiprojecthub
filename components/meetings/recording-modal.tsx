'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mic, MicOff, Square, Play, Pause, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useUser } from '@/lib/hooks/useUser'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordingComplete: () => void
}

export default function RecordingModal({ 
  isOpen, 
  onClose, 
  onRecordingComplete 
}: RecordingModalProps) {
  const { user } = useUser()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [hasUnsavedRecording, setHasUnsavedRecording] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<BlobPart[]>([]) // Keep chunks in ref for recovery

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Warn before leaving page with unsaved recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRecording) {
        e.preventDefault()
        e.returnValue = 'You have an unsaved recording. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Detect mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      let mediaRecorder: MediaRecorder
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 64000, // ~64 kbps keeps 60 min recording under 30MB
      }

      try {
        mediaRecorder = new MediaRecorder(stream, recorderOptions)
      } catch (error) {
        console.warn('Falling back to default MediaRecorder options:', error)
        mediaRecorder = new MediaRecorder(stream)
      }
      mediaRecorderRef.current = mediaRecorder

      chunksRef.current = [] // Reset chunks
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setHasUnsavedRecording(true) // Mark as unsaved
        
        // Save metadata for recovery
        localStorage.setItem('unsaved_recording_time', recordingTime.toString())
        localStorage.setItem('unsaved_recording_date', new Date().toISOString())
      }

      // Request data every 10 seconds for mobile reliability
      mediaRecorder.start(isMobile ? 10000 : undefined)
      setIsRecording(true)
      setRecordingTime(0)
      toast.success('Recording started' + (isMobile ? ' 📱' : ''))
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      toast.success('Recording completed')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        toast.success('Recording resumed')
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        toast.success('Recording paused')
      }
    }
  }

  const handleUpload = async () => {
    if (!audioBlob || !title.trim()) {
      toast.error('Please provide a title and ensure recording is complete')
      return
    }

    if (!user?.id) {
      toast.error('You must be logged in to save recordings')
      return
    }

    try {
      setUploading(true)
      
      // Get project context from localStorage
      const projectId = localStorage.getItem('recording_project_context')
      
      // Create form data for upload
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('title', title)
      formData.append('duration', recordingTime.toString())
      formData.append('userId', user.id)
      if (projectId) {
        formData.append('projectId', projectId)
        console.log(`📁 Recording will be linked to project: ${projectId}`)
      }
      
      // Upload to API
      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log('✅ Recording uploaded:', result?.session?.id || 'unknown')
      
      // Start transcription if AssemblyAI is configured
      // Ensure result exists and has recordingUrl before accessing it
      if (result && result.recordingUrl) {
        try {
          await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordingUrl: result.recordingUrl,
              sessionId: result.session.id,
            }),
          })
          console.log('🎙️ Transcription started')
        } catch (transcribeError) {
          console.warn('Transcription failed to start:', transcribeError)
          // Don't fail the whole upload if transcription fails
        }
      }
      
      toast.success('Recording uploaded successfully! AI processing will begin shortly.')
      
      // Clear unsaved flag and localStorage
      setHasUnsavedRecording(false)
      localStorage.removeItem('unsaved_recording_time')
      localStorage.removeItem('unsaved_recording_date')
      
      onRecordingComplete()
      onClose()
      
      // Reset state
      setTitle('')
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error uploading recording:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload recording')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (isRecording) {
      if (window.confirm('Are you sure you want to close? Your recording will be lost.')) {
        stopRecording()
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Voice Recording</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation p-1"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-gray-800 px-4 sm:px-6 py-4">
            {/* Unsaved Recording Warning */}
            {hasUnsavedRecording && !uploading && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ Unsaved Recording
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Please upload before closing or you'll lose this recording!
                </p>
              </div>
            )}

            {/* Recording Status */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isRecording ? (
                  <Mic className="h-12 w-12 text-red-600" />
                ) : (
                  <MicOff className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              <div className="text-3xl font-mono font-bold text-gray-900 mb-2">
                {formatTime(recordingTime)}
              </div>
              
              <p className="text-sm text-gray-500">
                {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to record'}
              </p>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="btn btn-primary flex items-center justify-center touch-manipulation w-full sm:w-auto"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseRecording}
                    className="btn btn-outline flex items-center justify-center touch-manipulation w-full sm:w-auto"
                  >
                    {isPaused ? (
                      <Play className="h-4 w-4 mr-2" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  
                  <button
                    onClick={stopRecording}
                    className="btn btn-destructive flex items-center justify-center touch-manipulation w-full sm:w-auto"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </button>
                </>
              )}
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="mb-6">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  className="w-full"
                />
              </div>
            )}

            {/* Title Input */}
            <div className="mb-6">
              <label htmlFor="recording-title" className="label">
                Recording Title
              </label>
              <input
                type="text"
                id="recording-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter recording title"
                className="input mt-1"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleClose}
              className="btn btn-outline touch-manipulation w-full sm:w-auto order-2 sm:order-1"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="btn btn-primary flex items-center justify-center touch-manipulation w-full sm:w-auto order-1 sm:order-2"
              disabled={!audioBlob || !title.trim() || uploading}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




















