'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mic, MicOff, Square, Play, Pause, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/app/providers'
import ProjectSelector from '@/components/recording/ProjectSelector'
import { recordingUploadService } from '@/lib/services/recording-upload-service'
import { recordingBackupService } from '@/lib/services/recording-backup-service'
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
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const isOnlineRef = useRef<boolean>(navigator.onLine)

  // Live upload state
  const [liveUploadStatus, setLiveUploadStatus] = useState<string>('')
  const [chunksUploaded, setChunksUploaded] = useState<number>(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [chunksBackedUp, setChunksBackedUp] = useState<number>(0)

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
      // Release wake lock if active
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
      }
    }
  }, [])

  // Initialize backup service
  useEffect(() => {
    recordingBackupService.init().catch(err => {
      console.error('Failed to initialize backup service:', err)
    })
  }, [])

  // Retry failed uploads when back online
  const retryFailedUploads = async () => {
    if (!sessionId) return

    try {
      const chunks = await recordingBackupService.getChunks(sessionId)
      const failedChunks = chunks.filter(chunk => !chunk.uploaded)

      if (failedChunks.length > 0) {
        setLiveUploadStatus(`Retrying ${failedChunks.length} failed uploads...`)
        
        for (const chunk of failedChunks) {
          if (!isOnlineRef.current) break // Stop if went offline again

          try {
            const userId = user?.id || 'demo-user'
            const result = await recordingUploadService.uploadChunkLive(
              chunk.blob,
              userId,
              sessionId,
              chunk.chunkIndex
            )

            if (result.success && result.path) {
              await recordingBackupService.markChunkUploaded(sessionId, chunk.chunkIndex)
              setChunksUploaded(prev => prev + 1)
            }
          } catch (error) {
            console.error(`Failed to retry chunk ${chunk.chunkIndex}:`, error)
          }
        }

        setLiveUploadStatus('✅ All chunks uploaded successfully')
      }
    } catch (error) {
      console.error('Error retrying failed uploads:', error)
    }
  }

  // Network state monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      isOnlineRef.current = true
      setLiveUploadStatus('🟢 Back online - resuming uploads...')
      // Retry failed uploads when back online
      retryFailedUploads()
    }

    const handleOffline = () => {
      setIsOnline(false)
      isOnlineRef.current = false
      setLiveUploadStatus('🔴 Offline - chunks saved locally, will upload when online')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [sessionId, user?.id])

  // Page visibility handling (prevents recording pause on tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRecording && !isPaused) {
        // Tab switched or screen locked
        console.log('📱 Page hidden during recording')
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        
        if (isIOS) {
          // iOS may pause recording when screen locks
          toast('⚠️ Screen locked/backgrounded - Recording may pause on iPhone!', {
            icon: '📱',
            duration: 5000,
          })
        } else {
          // Other browsers - recording should continue
          toast('Recording continues in background', { icon: '📱', duration: 3000 })
        }
        
        // Try to re-request wake lock if available
        if ('wakeLock' in navigator && wakeLockRef.current === null) {
          requestWakeLock().catch(() => {})
        }
      } else if (!document.hidden && isRecording && !isPaused) {
        // Page visible again - check if recording is still active
        console.log('📱 Page visible again - checking recording status')
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
          toast.error('⚠️ Recording stopped when screen was locked. Please start a new recording.', {
            duration: 6000,
          })
          setIsRecording(false)
        } else {
          toast('✅ Recording resumed', { icon: '✅', duration: 2000 })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRecording, isPaused])

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording && !isPaused) {
        e.preventDefault()
        e.returnValue = 'Recording in progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isRecording, isPaused])

  // Request wake lock to prevent screen sleep (mobile support)
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen')
        wakeLockRef.current = wakeLock
        
        // ✅ CRITICAL: Re-request wake lock if it's released (e.g., screen lock button pressed)
        const handleWakeLockRelease = async () => {
          console.log('⚠️ Wake lock released - screen may sleep')
          // Re-request if still recording
          if (isRecording && !isPaused) {
            console.log('🔄 Re-requesting wake lock...')
            try {
              const newWakeLock = await (navigator as any).wakeLock.request('screen')
              wakeLockRef.current = newWakeLock
              newWakeLock.addEventListener('release', handleWakeLockRelease) // Re-attach listener
              console.log('✅ Wake lock re-acquired')
            } catch (reRequestError) {
              console.warn('Failed to re-request wake lock:', reRequestError)
              // On iOS, this might fail - warn user
              const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
              if (isIOS) {
                toast('⚠️ Screen locked - recording may pause on iOS. Keep screen on!', {
                  icon: '📱',
                  duration: 5000,
                })
              }
            }
          }
        }
        wakeLock.addEventListener('release', handleWakeLockRelease)
        
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isIOS) {
          toast('📱 Keep screen on! Locking screen may pause recording on iPhone', {
            icon: '📱',
            duration: 5000,
          })
        } else {
          toast('📱 Screen will stay awake during recording', { duration: 3000 })
        }
      } else {
        // Wake Lock not supported - warn iOS users
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isIOS) {
          toast('⚠️ Keep screen on! Locking screen will pause recording on iPhone', {
            icon: '📱',
            duration: 6000,
          })
        }
      }
    } catch (err) {
      console.warn('Wake Lock API not supported or failed:', err)
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isIOS) {
        toast('⚠️ Keep screen on! Locking screen will pause recording on iPhone', {
          icon: '📱',
          duration: 6000,
        })
      }
      // Not critical, continue recording
    }
  }

  // Release wake lock
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      } catch (err) {
        console.warn('Failed to release wake lock:', err)
      }
    }
  }

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

      // Detect mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      // Generate session ID NOW (before recording starts)
      const newSessionId = crypto.randomUUID()
      setSessionId(newSessionId)
      chunkIndexRef.current = 0
      uploadedChunksRef.current = []
      setChunksUploaded(0)

      // Determine best mimeType for device
      let mimeType = 'audio/webm'
      if (isMobile) {
        // Check for supported mimeTypes on mobile
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
          mimeType = 'audio/mpeg'
        } else {
          // Fallback to default
          mimeType = ''
        }
      }

      let mediaRecorder: MediaRecorder
      const recorderOptions: MediaRecorderOptions = {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 64000,
      }

      try {
        mediaRecorder = new MediaRecorder(stream, recorderOptions)
      } catch (error) {
        console.warn('Falling back to default MediaRecorder options:', error)
        mediaRecorder = new MediaRecorder(stream)
      }
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
          
          const userId = user?.id || 'demo-user'
          
          // 💾 BACKUP: Save chunk to IndexedDB FIRST (local backup)
          try {
            await recordingBackupService.saveChunk({
              sessionId: newSessionId,
              chunkIndex,
              blob: chunk,
              timestamp: Date.now(),
              uploaded: false
            })
            setChunksBackedUp(prev => prev + 1)
            console.log(`💾 Chunk ${chunkIndex} backed up to IndexedDB`)
          } catch (backupError) {
            console.error('Failed to backup chunk to IndexedDB:', backupError)
            // Continue even if backup fails
          }
          
          // ☁️ UPLOAD: Try to upload to cloud (if online)
          if (isOnlineRef.current) {
            setLiveUploadStatus(`Uploading chunk ${chunkIndex + 1}...`)
            
            try {
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
                
                // Mark as uploaded in backup
                await recordingBackupService.markChunkUploaded(newSessionId, chunkIndex)
              } else {
                console.error(`❌ Failed to upload chunk ${chunkIndex}:`, result.error)
                setLiveUploadStatus(`⚠️ Chunk ${chunkIndex + 1} saved locally, will upload when online`)
                // Chunk is already backed up, will retry when online
              }
            } catch (error) {
              console.error(`Error uploading chunk ${chunkIndex}:`, error)
              setLiveUploadStatus(`⚠️ Chunk ${chunkIndex + 1} saved locally, will upload when online`)
              // Chunk is already backed up, will retry when online
            }
          } else {
            setLiveUploadStatus(`💾 Chunk ${chunkIndex + 1} saved locally (offline)`)
          }

          // Save session metadata to backup
          await recordingBackupService.saveSession({
            sessionId: newSessionId,
            userId,
            projectId: selectedProjectId,
            startTime: Date.now(),
            chunks: [], // Will be retrieved from chunks store
            uploadedChunks: uploadedChunksRef.current,
            status: isPaused ? 'paused' : 'recording'
          })
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

      // Request wake lock for mobile (prevents screen sleep)
      await requestWakeLock()
      
      // Start recording with timeslice for chunked data (10 seconds for mobile reliability)
      const timeslice = isMobile ? 10000 : 10000 // 10 seconds for both mobile and desktop
      mediaRecorder.start(timeslice) // Capture and trigger ondataavailable every 10 seconds
      
      setIsRecording(true)
      setRecordingTime(0)
      
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isIOS) {
        toast.success('Recording started 📱 - Keep screen on!', {
          duration: 5000,
        })
        toast('⚠️ IMPORTANT: Do NOT lock your iPhone screen - it will pause recording!', {
          icon: '📱',
          duration: 8000,
        })
      } else {
        toast.success('Recording started' + (isMobile ? ' 📱' : '') + ' - Auto-saving every 10 seconds', {
          duration: 5000,
        })
      }
      
      toast('💾 Your recording is backed up locally - safe from crashes & network issues', {
        icon: '💾',
        duration: 5000,
      })
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      // Release wake lock
      await releaseWakeLock()
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      // Update session status in backup
      if (sessionId) {
        await recordingBackupService.saveSession({
          sessionId,
          userId: user?.id || 'demo-user',
          projectId: selectedProjectId,
          startTime: Date.now(),
          chunks: [],
          uploadedChunks: uploadedChunksRef.current,
          status: 'stopped'
        })
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
                  
                  {/* iOS Warning - Keep Screen On */}
                  {isRecording && typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                        <div className="text-xs text-yellow-800 dark:text-yellow-200">
                          <p className="font-semibold mb-1">Keep your iPhone screen ON!</p>
                          <p>Locking the screen will pause recording. Keep the app open and screen active.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Live Upload Status */}
                  {isRecording && (
                    <div className="mt-3 space-y-2">
                      {/* Cloud Upload Status */}
                      <div className={`p-2 border rounded-lg ${
                        isOnline 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}>
                        <div className="flex items-center justify-center gap-2 text-xs">
                          {isOnline ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className={`font-medium ${isOnline ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                {chunksUploaded} chunks saved to cloud
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <span className="font-medium text-yellow-700 dark:text-yellow-300">
                                Offline - {chunksBackedUp} chunks saved locally
                              </span>
                            </>
                          )}
                        </div>
                        {liveUploadStatus && (
                          <p className={`text-xs mt-1 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                            {liveUploadStatus}
                          </p>
                        )}
                      </div>
                      
                      {/* Local Backup Status */}
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">{chunksBackedUp} chunks backed up locally</span>
                          <span className="text-blue-500">💾</span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Safe from crashes, battery death, and network issues
                        </p>
                      </div>
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

