'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mic, MicOff, Square, Play, Pause, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/app/providers'
import ProjectSelector from '@/components/recording/ProjectSelector'
import { recordingUploadService } from '@/lib/services/recording-upload-service'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordingComplete: () => void
}

type ProcessingStep = 'uploading' | 'transcribing' | 'generating-tasks' | 'complete'

export default function EnhancedRecordingModal({ 
  isOpen, 
  onClose, 
  onRecordingComplete 
}: RecordingModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(true) // AI will generate title
  
  // Processing state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [meetingId, setMeetingId] = useState<string | null>(null)
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const chunkIndexRef = useRef<number>(0)
  const uploadedChunksRef = useRef<string[]>([]) // Track uploaded chunk paths

  // Live upload state
  const [liveUploadStatus, setLiveUploadStatus] = useState<string>('')
  const [chunksUploaded, setChunksUploaded] = useState<number>(0)

  // Timer effect
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    // Validate project selection
    if (!selectedProjectId) {
      toast.error('Please select a project before recording')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Generate session ID NOW (before recording starts)
      const newSessionId = crypto.randomUUID()
      setSessionId(newSessionId)
      chunkIndexRef.current = 0
      uploadedChunksRef.current = []
      setChunksUploaded(0)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // 🚀 LIVE UPLOAD: Capture and upload chunks IMMEDIATELY as they arrive
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunk = event.data
          chunksRef.current.push(chunk)
          
          // Upload this chunk IMMEDIATELY to Supabase
          const chunkIndex = chunkIndexRef.current
          chunkIndexRef.current++
          
          setLiveUploadStatus(`Uploading chunk ${chunkIndex + 1}...`)
          
          try {
            const userId = user?.id || 'demo-user'
            const result = await recordingUploadService.uploadChunkLive(
              chunk,
              userId,
              newSessionId,
              chunkIndex
            )
            
            if (result.success && result.path) {
              uploadedChunksRef.current.push(result.path)
              setChunksUploaded(prev => prev + 1)
              setLiveUploadStatus(`✓ Chunk ${chunkIndex + 1} saved to cloud`)
              console.log(`✅ Chunk ${chunkIndex} uploaded successfully`)
            } else {
              console.error(`❌ Failed to upload chunk ${chunkIndex}:`, result.error)
              // Queue for retry (implementation can be added later)
              toast.error(`Chunk ${chunkIndex + 1} upload failed - will retry`)
            }
          } catch (error) {
            console.error(`Error uploading chunk ${chunkIndex}:`, error)
          }
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const currentSessionId = newSessionId // Use the local variable, not state
        
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setLiveUploadStatus(`Recording complete - ${chunksUploaded} chunks saved`)
        
        // Auto-save to database and trigger AI processing
        console.log('🔄 Auto-saving recording to database...')
        console.log('📦 Blob size:', blob.size, 'Session ID:', currentSessionId)
        toast.loading('Processing recording...', { id: 'processing' })
        
        // Small delay to ensure all chunks are uploaded
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Trigger upload and AI processing with direct parameters
        handleUpload(blob, currentSessionId)
      }

      // Start recording with timeslice for chunked data (10 seconds)
      mediaRecorder.start(10000) // Capture and trigger ondataavailable every 10 seconds
      setIsRecording(true)
      setRecordingTime(0)
      toast.success('🎙️ Recording started - Auto-saving every 10 seconds')
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

  const handleUpload = async (blobParam?: Blob, sessionIdParam?: string) => {
    // Use parameters if provided, otherwise fall back to state
    const blob = blobParam || audioBlob
    const currentSessionId = sessionIdParam || sessionId
    
    console.log('🔵 handleUpload called')
    console.log('audioBlob:', !!blob, 'selectedProjectId:', selectedProjectId, 'sessionId:', currentSessionId)
    
    if (!blob || !selectedProjectId || !currentSessionId) {
      console.error('❌ Missing required data:', { audioBlob: !!blob, selectedProjectId, sessionId: currentSessionId })
      toast.error('Please select a project and complete recording')
      return
    }
    
    // Title is optional - AI will generate it from transcript
    if (!autoGenerateTitle && !title.trim()) {
      toast.error('Please provide a title or enable auto-generate')
      return
    }

    if (!user) {
      toast.error('You must be logged in to upload recordings')
      return
    }

    console.log('✅ All checks passed, starting upload...')

    try {
      setUploading(true)
      setProcessingStep('uploading')
      
      const userId = user.id || 'demo-user'
      console.log('📦 userId:', userId)
      
      // ✅ Chunks are ALREADY uploaded during recording!
      // Just need to assemble final file and create database entries
      
      toast.success(`All ${chunksUploaded} chunks already saved to cloud!`)
      setUploadProgress(100)
      
      // Assemble chunks into final file (optional - for easier playback)
      const finalPath = `${userId}/${currentSessionId}/recording.webm`
      console.log('🔧 Assembling chunks...')
      const assembleResult = await recordingUploadService.assembleChunks(
        userId,
        currentSessionId,
        chunkIndexRef.current
      )
      console.log('✅ Chunks assembled:', assembleResult)
      
      const storagePath = assembleResult.finalPath || finalPath
      console.log('💾 Storage path:', storagePath)

      // Create meeting entry (with temporary title if auto-generating)
      if (supabase) {
        console.log('📝 Creating meeting entry in database...')
        const meetingTitle = autoGenerateTitle 
          ? `Recording ${new Date().toLocaleString()}` // Temporary - AI will replace
          : title
        
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .insert({
            title: meetingTitle,
            description: description || 'AI will generate summary',
            scheduled_at: new Date().toISOString(),
            duration: Math.floor(recordingTime / 60),
            meeting_type: 'recording',
          })
          .select()
          .single()

        if (meetingError) {
          console.error('❌ Meeting creation error:', meetingError)
          throw meetingError
        }
        console.log('✅ Meeting created:', meeting.id)
        setMeetingId(meeting.id)

        // Create recording session entry
        console.log('🎙️ Creating recording session...')
        const { error: sessionError } = await supabase
          .from('recording_sessions')
          .insert({
            id: currentSessionId,
            user_id: userId,
            project_id: selectedProjectId,
            title: meetingTitle,
            file_path: storagePath,
            storage_path: storagePath,
            file_size: blob.size,
            duration: recordingTime,
            transcription_status: 'pending',
            ai_processed: false,
            upload_progress: 100,
            chunks: chunkIndexRef.current,
            metadata: {
              meetingId: meeting.id,
              projectId: selectedProjectId,
            },
          })

        if (sessionError) {
          console.error('❌ Recording session error:', sessionError)
          throw sessionError
        }
        console.log('✅ Recording session created:', currentSessionId)
        
        // ✅ CRITICAL: Link recording session back to meeting!
        console.log('🔗 Linking recording session to meeting...')
        const { error: linkError } = await supabase
          .from('meetings')
          .update({ recording_session_id: currentSessionId })
          .eq('id', meeting.id)
        
        if (linkError) {
          console.error('❌ Error linking recording to meeting:', linkError)
        } else {
          console.log('✅ Recording session linked to meeting successfully')
        }
        console.log('✅ Recording session created')

        // Success! Meeting saved to database
        toast.dismiss('processing')
        toast.success('✅ Recording saved! Starting AI processing...')

        // Get signed URL for the recording
        console.log('🔗 Generating signed URL for:', storagePath)
        const signedUrl = await recordingUploadService.getSignedUrl(storagePath, 7200) // 2 hours
        console.log('🔗 Signed URL:', signedUrl ? '✅ Generated' : '❌ Failed')
        
        if (!signedUrl) {
          console.error('❌ Failed to generate signed URL')
          toast.error('Failed to generate access URL for transcription')
          throw new Error('Could not generate signed URL')
        }
        
        if (signedUrl) {
          // Start transcription
          setProcessingStep('transcribing')
          console.log('🎙️ Starting transcription...')
          console.log('   URL:', signedUrl.substring(0, 100) + '...')
          console.log('   Session ID:', currentSessionId)
          
          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordingUrl: signedUrl,
              sessionId: currentSessionId,
            }),
          })

          console.log('🎙️ Transcription API response status:', transcribeResponse.status)

          if (!transcribeResponse.ok) {
            const errorData = await transcribeResponse.json()
            console.error('❌ Transcription API error:', errorData)
            throw new Error(`Failed to start transcription: ${errorData.details || errorData.error}`)
          }

          const { transcriptId } = await transcribeResponse.json()
          console.log('✅ Transcription started with ID:', transcriptId)
          toast.success('Transcription in progress...')
          
          // Poll for transcription completion
          let attempts = 0
          const maxAttempts = 60 // 5 minutes max
          
          console.log('⏳ Polling for transcription completion (max 5 minutes)...')
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
            attempts++
            
            console.log(`📊 Polling attempt ${attempts}/${maxAttempts}...`)
            const statusResponse = await fetch(`/api/transcribe?transcriptId=${transcriptId}`)
            const { transcription } = await statusResponse.json()
            console.log(`   Status: ${transcription.status}`)
            
            if (transcription.status === 'completed') {
              toast.success('Transcription complete!')
              console.log('💾 Saving transcript to database...')
              
              // Save transcript to recording_sessions table
              if (supabase) {
                const { error: transcriptSaveError } = await supabase
                  .from('recording_sessions')
                  .update({
                    transcription_status: 'completed',
                    transcription_text: transcription.text,
                    transcription_confidence: transcription.confidence
                  })
                  .eq('id', currentSessionId)
                
                if (transcriptSaveError) {
                  console.error('❌ Error saving transcript:', transcriptSaveError)
                } else {
                  console.log('✅ Transcript saved to database')
                }
              }
              
              // Generate tasks
              setProcessingStep('generating-tasks')
              console.log('🤖 Generating tasks from transcript...')
              console.log('   Transcript length:', transcription.text?.length, 'characters')
              
              const tasksResponse = await fetch('/api/generate-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transcript: transcription.text,
                  projectId: selectedProjectId,
                  meetingId: meeting.id,
                  userId,
                }),
              })

              console.log('🤖 Task generation API response:', tasksResponse.status)

              if (tasksResponse.ok) {
                const { tasksCreated, meetingTitle } = await tasksResponse.json()
                console.log(`✅ AI Generated Title: "${meetingTitle}"`)
                console.log(`✅ Created ${tasksCreated} tasks`)
                toast.success(`✨ AI Generated: "${meetingTitle}" with ${tasksCreated} tasks!`)
              } else {
                const errorData = await tasksResponse.json()
                console.error('❌ Task generation error:', errorData)
                toast.error('Failed to generate tasks from transcript')
              }
              
              setProcessingStep('complete')
              toast.success('🎉 Recording complete! View it in your meetings.')
              
              // Close modal and refresh meetings page
              setTimeout(() => {
                onRecordingComplete()
                onClose()
                router.push('/meetings')
                // Force page refresh to show new meeting
                window.location.href = '/meetings'
              }, 2000)
              
              return
            } else if (transcription.status === 'error') {
              throw new Error('Transcription failed')
            }
            
            attempts++
          }
          
          throw new Error('Transcription timeout')
        }
      }
    } catch (error) {
      console.error('❌❌❌ Error uploading recording:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.dismiss('processing')
      toast.error('Failed to process recording: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setProcessingStep(null)
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
    } else if (uploading) {
      toast.error('Please wait for upload to complete')
    } else {
      onClose()
    }
  }

  const getProcessingMessage = () => {
    switch (processingStep) {
      case 'uploading':
        return `Uploading... ${uploadProgress}%`
      case 'transcribing':
        return 'Transcribing audio...'
      case 'generating-tasks':
        return 'Generating tasks with AI...'
      case 'complete':
        return 'Complete! Redirecting...'
      default:
        return ''
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {processingStep ? 'Processing Recording' : 'Record Meeting'}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation p-1"
                disabled={uploading}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white dark:bg-gray-800 px-4 sm:px-6 py-4">
            {processingStep ? (
              /* Processing View */
              <div className="text-center py-8">
                {processingStep === 'complete' ? (
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                ) : (
                  <Loader className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                )}
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getProcessingMessage()}
                </h3>
                
                {processingStep === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mt-4">
                  {processingStep === 'transcribing' && 'This may take a few minutes...'}
                  {processingStep === 'generating-tasks' && 'Analyzing transcript for action items...'}
                  {processingStep === 'complete' && 'Opening meeting details...'}
                </p>
              </div>
            ) : (
              /* Recording View */
              <>
                {/* Project Selector - Required */}
                <div className="mb-6">
                  <ProjectSelector
                    selectedProjectId={selectedProjectId}
                    onSelectProject={setSelectedProjectId}
                    required
                  />
                </div>

                {/* Recording Status */}
                <div className="text-center mb-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
                  }`}>
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
                  
                  {/* Live Upload Status */}
                  {isRecording && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-xs text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">{chunksUploaded} chunks saved to cloud</span>
                      </div>
                      {liveUploadStatus && (
                        <p className="text-xs text-green-600 mt-1">{liveUploadStatus}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recording Controls */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={!selectedProjectId}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
                    >
                      <Mic className="h-4 w-4" />
                      Start Recording
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={pauseRecording}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
                      >
                        {isPaused ? (
                          <><Play className="h-4 w-4" /> Resume</>
                        ) : (
                          <><Pause className="h-4 w-4" /> Pause</>
                        )}
                      </button>
                      
                      <button
                        onClick={stopRecording}
                        className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
                      >
                        <Square className="h-4 w-4" />
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

                {/* Title Input - Optional (AI can generate) */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="recording-title" className="block text-sm font-medium text-gray-700">
                      Meeting Title {!autoGenerateTitle && <span className="text-red-500">*</span>}
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={autoGenerateTitle}
                        onChange={(e) => setAutoGenerateTitle(e.target.checked)}
                        className="rounded"
                      />
                      <span>AI generate title</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    id="recording-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={autoGenerateTitle ? "AI will generate from transcript" : "Enter meeting title"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    disabled={uploading || autoGenerateTitle}
                  />
                  {autoGenerateTitle && (
                    <p className="text-xs text-blue-600 mt-1">✨ AI will create a descriptive title from the transcript</p>
                  )}
                </div>

                {/* Description Input */}
                <div className="mb-6">
                  <label htmlFor="recording-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="recording-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about the meeting"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={uploading}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!processingStep && (
            <div className="bg-gray-50 dark:bg-gray-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 touch-manipulation w-full sm:w-auto order-2 sm:order-1"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto order-1 sm:order-2"
                disabled={!audioBlob || (!autoGenerateTitle && !title.trim()) || !selectedProjectId || uploading}
              >
                {uploading ? (
                  <><Loader className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload & Process</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

