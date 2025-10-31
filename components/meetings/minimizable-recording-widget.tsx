'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mic, MicOff, Square, Play, Pause, Upload, Minimize2, Maximize2, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

interface MinimizableRecordingWidgetProps {
  isOpen: boolean
  onClose: () => void
  onRecordingComplete: () => void
}

export default function MinimizableRecordingWidget({ 
  isOpen, 
  onClose, 
  onRecordingComplete 
}: MinimizableRecordingWidgetProps) {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

  // Load projects on mount and when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadProjects()
    }
  }, [isOpen, user])

  const loadProjects = async () => {
    try {
      console.log('Loading projects for user:', user?.id)
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('owner_id', user?.id)  // Fixed: use owner_id instead of user_id
        .order('name')

      if (error) {
        console.error('Error loading projects:', error)
        throw error
      }
      
      console.log('Loaded projects:', data)
      setProjects(data || [])
      
      if (!data || data.length === 0) {
        toast('No projects found. Create a project first!', {
          icon: '📁',
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    }
  }

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    // Validate project is selected
    if (!selectedProjectId) {
      toast.error('Please select a project first!')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        // Automatically start upload and processing
        // Small delay to ensure state is updated
        setTimeout(() => {
          handleUploadWithBlob(blob)
        }, 100)
      }

      // Request data every second for real-time chunking (optional)
      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      toast.success('🎙️ Recording started - Click anywhere outside to minimize!', {
        duration: 4000,
      })
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
      
      toast.success('🎙️ Recording completed! Starting AI processing...')
      // Note: Upload is automatically triggered in the onstop handler
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

  const handleUploadWithBlob = async (blob: Blob) => {
    console.log('🎙️ Starting upload process...')
    console.log('Blob size:', blob.size, 'bytes')
    console.log('User ID:', user?.id)
    console.log('Project ID:', selectedProjectId)
    
    if (!blob) {
      console.error('❌ No recording blob available')
      toast.error('No recording available')
      return
    }

    if (!selectedProjectId) {
      console.error('❌ No project selected')
      toast.error('Project is required (should have been selected before recording)')
      return
    }

    try {
      setUploading(true)
      setProcessingStatus('Uploading recording...')
      
      // Upload audio to Supabase Storage
      const fileName = `recording_${Date.now()}_${user?.id}.webm`
      console.log('📤 Uploading to storage:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meeting-recordings')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        })

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        throw uploadError
      }
      
      console.log('✅ Upload successful:', uploadData)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(fileName)
      
      console.log('📍 Public URL:', publicUrl)

      // Create meeting record with temporary title (AI will update it later)
      const tempTitle = `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
      console.log('💾 Creating meeting record:', tempTitle)
      
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: tempTitle,
          user_id: user?.id,
          scheduled_at: new Date().toISOString(),
          project_id: selectedProjectId,
          status: 'completed',
          recording_url: publicUrl,
        })
        .select()
        .single()

      if (meetingError) {
        console.error('❌ Meeting creation error:', meetingError)
        throw meetingError
      }
      
      console.log('✅ Meeting created:', meetingData.id)

      // Create recording session
      console.log('💾 Creating recording session...')
      const { data: sessionData, error: sessionError } = await supabase
        .from('recording_sessions')
        .insert({
          user_id: user?.id,
          audio_url: publicUrl,
          title: tempTitle,
          file_path: publicUrl,
          duration_seconds: recordingTime,
          transcription_status: 'pending',
          ai_processed: false,
          metadata: { meetingId: meetingData.id, projectId: selectedProjectId },
        })
        .select()
        .single()

      if (sessionError) {
        console.error('❌ Recording session error:', sessionError)
        throw sessionError
      }
      
      console.log('✅ Recording session created:', sessionData.id)

      toast.success('✅ Recording uploaded! AI is generating title and extracting tasks...')
      
      // Start background processing (don't wait for it)
      console.log('🤖 Starting background AI processing...')
      processRecordingInBackground(sessionData.id, meetingData.id, publicUrl, selectedProjectId)
      
      // Close and reset immediately so user can continue
      onRecordingComplete()
      onClose()
      resetState()
      
    } catch (error) {
      console.error('❌ UPLOAD FAILED:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error(`Failed to upload recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploading(false)
      setProcessingStatus('')
    }
  }

  const processRecordingInBackground = async (
    sessionId: string, 
    meetingId: string, 
    audioUrl: string, 
    projectId: string
  ) => {
    try {
      // Show notification that processing has started
      toast('🤖 AI is processing your recording...', {
        duration: 5000,
        icon: '⚙️',
      })

      // Start transcription
      setProcessingStatus('Transcribing audio...')
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingUrl: audioUrl,
          sessionId: sessionId,
        }),
      })

      const transcribeData = await transcribeResponse.json()
      
      if (!transcribeData.success) {
        throw new Error('Transcription failed')
      }

      // Poll for transcription completion (max 5 minutes)
      let transcript = ''
      let attempts = 0
      const maxAttempts = 60 // 5 minutes (5 second intervals)
      
      setProcessingStatus('Waiting for transcription...')
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        
        const statusResponse = await fetch('/api/transcribe', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcriptId: transcribeData.transcriptId,
            sessionId: sessionId,
          }),
        })

        const statusData = await statusResponse.json()
        
        if (statusData.status === 'completed') {
          transcript = statusData.text
          break
        } else if (statusData.status === 'error') {
          throw new Error('Transcription failed')
        }
        
        attempts++
      }

      if (!transcript) {
        throw new Error('Transcription timed out')
      }

      // Generate tasks and summary
      setProcessingStatus('Generating tasks and summary...')
      const tasksResponse = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          projectId: projectId,
          meetingId: meetingId,
          userId: user?.id,
        }),
      })

      const tasksData = await tasksResponse.json()
      
      console.log('✅ Task generation response:', tasksData)
      
      if (tasksData.success) {
        console.log(`🎉 Created ${tasksData.tasksCreated} tasks for project ${projectId}`)
        toast.success(`✨ Processing complete! ${tasksData.tasksCreated} tasks created`, {
          duration: 8000,
          icon: '🎉',
        })
      } else {
        console.error('❌ Task generation failed:', tasksData.error)
        toast('⚠️ Recording transcribed, but task generation had issues', {
          duration: 6000,
        })
      }
      
      setProcessingStatus('')
      setIsProcessing(false)
      
    } catch (error) {
      console.error('❌ Background processing error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error('Background processing failed. You can retry from the meeting page.', {
        duration: 8000,
      })
      setProcessingStatus('')
      setIsProcessing(false)
    }
  }

  const resetState = () => {
    setTitle('')
    setSelectedProjectId('')
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setUploading(false)
    setIsProcessing(false)
    setProcessingStatus('')
  }

  const handleClose = () => {
    if (isRecording) {
      // Auto-minimize instead of closing to prevent losing recording
      setIsMinimized(true)
      toast.success('Recording minimized - Keep using the app!', {
        duration: 3000,
        icon: '📍',
      })
    } else {
      onClose()
      resetState()
    }
  }

  const forceClose = () => {
    if (isRecording) {
      if (window.confirm('Are you sure you want to stop and discard this recording?')) {
        stopRecording()
        onClose()
        resetState()
      }
    } else {
      onClose()
      resetState()
    }
  }

  if (!isOpen) return null

  // Minimized view - bottom right corner
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl border-2 border-indigo-500 p-4 w-72">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {isRecording ? 'Recording...' : 'Ready to Record'}
                </span>
                {selectedProjectId && (
                  <span className="text-xs text-gray-500">
                    {projects.find(p => p.id === selectedProjectId)?.name || 'Project'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Maximize"
              >
                <Maximize2 className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={forceClose}
                className="p-1 hover:bg-red-100 rounded"
                title="Stop & Discard Recording"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
          
          {isRecording && (
            <>
              <div className="text-2xl font-mono font-bold text-gray-900 mb-2">
                {formatTime(recordingTime)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={pauseRecording}
                  className="flex-1 btn btn-sm btn-outline"
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </button>
                <button
                  onClick={stopRecording}
                  className="flex-1 btn btn-sm btn-destructive"
                >
                  <Square className="h-3 w-3" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Full view - center modal
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleClose}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Smart backdrop - auto-minimizes when recording, closes when not */}
        <div 
          className={`fixed inset-0 transition-opacity ${
            isRecording ? 'bg-gray-900 bg-opacity-20' : 'bg-gray-500 bg-opacity-75'
          }`}
          aria-hidden="true"
        />

        {/* Modal - Stop click propagation so clicking inside doesn't minimize */}
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🎙️ Voice Recording
                {isProcessing && <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />}
              </h3>
              <div className="flex gap-2">
                {isRecording && (
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-1 rounded"
                    title="Minimize - Continue using the app"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className={`${
                    isRecording 
                      ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' 
                      : 'text-gray-400 hover:text-gray-600'
                  } p-1 rounded`}
                  title={isRecording ? 'Minimize (recording will continue)' : 'Close'}
                >
                  {isRecording ? <Minimize2 className="h-6 w-6" /> : <X className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-4">
            {processingStatus && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-sm text-indigo-700">{processingStatus}</span>
                </div>
              </div>
            )}

            {/* Project Selection - REQUIRED BEFORE RECORDING */}
            {!isRecording && !audioBlob && (
              <div className="mb-6">
                <label htmlFor="project-select-before" className="label">
                  Select Project <span className="text-red-500">*</span>
                </label>
                <select
                  id="project-select-before"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="input mt-1"
                >
                  <option value="">Choose a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  A project must be selected before recording
                </p>
              </div>
            )}

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
              
              {isRecording && (
                <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs text-indigo-700 text-center">
                    💡 Click <strong>anywhere outside</strong> or the <strong>minimize icon</strong> to continue using the app
                  </p>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex justify-center space-x-4 mb-6">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!selectedProjectId}
                  className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!selectedProjectId ? 'Please select a project first' : 'Start recording'}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseRecording}
                    className="btn btn-outline flex items-center"
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
                    className="btn btn-destructive flex items-center"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </button>
                </>
              )}
            </div>

            {/* Processing status (shown briefly after stopping) */}
            {!isRecording && audioBlob && uploading && (
              <div className="mb-6">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900 mb-1">
                        Processing your recording...
                      </p>
                      <ul className="text-xs text-indigo-700 space-y-1">
                        <li>✨ Generating intelligent title</li>
                        <li>📝 Creating meeting summary</li>
                        <li>✅ Extracting actionable tasks</li>
                      </ul>
                      <p className="text-xs text-indigo-600 mt-3">
                        <strong>Project:</strong> {projects.find(p => p.id === selectedProjectId)?.name || 'Unknown Project'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

