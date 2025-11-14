'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Mic, MicOff, Square, Play, Pause, Upload, Minimize2, Maximize2, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { recordingBackupService } from '@/lib/services/recording-backup-service'

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
  // Helper function to start client-side polling for a specific recording
  const startClientSidePolling = (sessionId: string) => {
    let attempts = 0
    const maxAttempts = 120 // 10 minutes max (5 seconds * 120)
    
    const pollInterval = setInterval(async () => {
      attempts++
      
      try {
        const response = await fetch('/api/check-transcription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.status === 'completed') {
            console.log(`✅ Transcription completed for ${sessionId}`)
            clearInterval(pollInterval)
            toast.success('Transcription complete! AI processing will start shortly.')
            // ✅ Trigger refresh to show the recording in the list
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('recording-processed', { 
                detail: { sessionId } 
              }))
              setTimeout(() => window.location.reload(), 2000)
            }
          } else if (data.status === 'error') {
            console.error(`❌ Transcription failed: ${data.message}`)
            clearInterval(pollInterval)
            toast.error('Transcription failed: ' + data.message)
          }
          // else still processing, continue polling
        }
      } catch (error) {
        console.error(`Error polling transcription:`, error)
      }
      
      if (attempts >= maxAttempts) {
        console.warn(`⚠️ Polling timeout for ${sessionId}`)
        clearInterval(pollInterval)
      }
    }, 5000) // Poll every 5 seconds
  }
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
  const wakeLockRef = useRef<any>(null) // WakeLockSentinel type not available in all TypeScript versions
  const sessionIdRef = useRef<string | null>(null)
  const chunkIndexRef = useRef<number>(0)
  const chunksBackedUpRef = useRef<number>(0)
  const recordingTimeRef = useRef<number>(0) // Track recording time for state saves

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
        setRecordingTime(prev => {
          const newTime = prev + 1
          recordingTimeRef.current = newTime // Update ref for state saves
          return newTime
        })
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
    // Initialize backup service
    recordingBackupService.init().catch(err => {
      console.warn('Failed to initialize backup service:', err)
    })

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      // Release wake lock on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
      }
    }
  }, [])

  // ✅ Warn before leaving page with unsaved recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording) {
        e.preventDefault()
        e.returnValue = 'You are currently recording. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isRecording])

  // ✅ Mobile-specific: Page visibility handling with recovery
  useEffect(() => {
    if (!isRecording) return

    const handleVisibilityChange = () => {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      const isAndroid = /Android/i.test(navigator.userAgent)

      if (document.hidden) {
        // Page went to background - save state immediately
        if (sessionIdRef.current && chunksBackedUpRef.current > 0) {
          // Save recovery state to localStorage as backup
          try {
            localStorage.setItem('recording_recovery_state', JSON.stringify({
              sessionId: sessionIdRef.current,
              chunksBackedUp: chunksBackedUpRef.current,
              recordingTime: recordingTimeRef.current, // Use ref for current value
              timestamp: Date.now(),
              projectId: selectedProjectId
            }))
            console.log('💾 Saved recovery state to localStorage')
          } catch (e) {
            console.warn('Failed to save recovery state:', e)
          }
        }

        if (isIOS) {
          toast('⚠️ Keep app open! iOS may pause recording in background', {
            icon: '📱',
            duration: 8000,
          })
        } else if (isAndroid) {
          toast('📱 Recording continues in background - chunks are saved', {
            icon: '💾',
            duration: 4000,
          })
        }
      } else {
        // Page visible again - check recording status
        console.log('📱 Page visible - checking recording status')
        
        if (mediaRecorderRef.current) {
          const state = mediaRecorderRef.current.state
          
          if (state === 'inactive' || state === 'paused') {
            // Recording stopped - try to recover
            toast.error('⚠️ Recording may have stopped. Check your recording status.', {
              duration: 6000,
            })
            
            // Check if we have backed up chunks
            if (sessionIdRef.current) {
              recordingBackupService.getChunks(sessionIdRef.current)
                .then(chunks => {
                  if (chunks.length > 0) {
                    toast.success(`💾 Found ${chunks.length} saved chunks - your recording is safe!`, {
                      duration: 6000,
                    })
                  }
                })
                .catch(err => console.error('Error checking chunks:', err))
            }
          } else {
            toast('✅ Recording is active', { icon: '✅', duration: 2000 })
            
            // Re-request wake lock if released
            if ('wakeLock' in navigator && wakeLockRef.current === null) {
              requestWakeLock().catch(() => {})
            }
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRecording, recordingTime, selectedProjectId])

  // ✅ Mobile recovery: Check for incomplete recordings on mount
  useEffect(() => {
    const checkRecoveryState = async () => {
      try {
        const recoveryState = localStorage.getItem('recording_recovery_state')
        if (!recoveryState) return

        const state = JSON.parse(recoveryState)
        const age = Date.now() - state.timestamp
        const isRecent = age < 24 * 60 * 60 * 1000 // 24 hours

        if (!isRecent) {
          // Old recovery state - clean up
          localStorage.removeItem('recording_recovery_state')
          return
        }

        // Check if session has chunks in IndexedDB
        await recordingBackupService.init()
        const chunks = await recordingBackupService.getChunks(state.sessionId)

        if (chunks.length > 0) {
          // Found incomplete recording - show recovery option
          const shouldRecover = window.confirm(
            `📱 Found incomplete recording from ${new Date(state.timestamp).toLocaleString()}\n\n` +
            `Duration: ${Math.floor(state.recordingTime / 60)}:${String(state.recordingTime % 60).padStart(2, '0')}\n` +
            `Chunks saved: ${chunks.length}\n\n` +
            `Would you like to recover this recording?`
          )

          if (shouldRecover) {
            // Recover recording
            toast.loading('Recovering recording...', { id: 'recovery' })
            
            // Reassemble blob from chunks
            const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
            const blobParts = sortedChunks.map(chunk => chunk.blob)
            const recoveredBlob = new Blob(blobParts, { type: 'audio/webm' })

            setAudioBlob(recoveredBlob)
            setAudioUrl(URL.createObjectURL(recoveredBlob))
            setRecordingTime(state.recordingTime)
            setSelectedProjectId(state.projectId || '')
            sessionIdRef.current = state.sessionId
            chunksBackedUpRef.current = chunks.length

            toast.success('✅ Recording recovered! Click Upload & Process to save it.', {
              id: 'recovery',
              duration: 8000,
            })

            // Clean up recovery state
            localStorage.removeItem('recording_recovery_state')
          } else {
            // User chose not to recover - clean up
            localStorage.removeItem('recording_recovery_state')
          }
        } else {
          // No chunks found - clean up
          localStorage.removeItem('recording_recovery_state')
        }
      } catch (error) {
        console.error('Error checking recovery state:', error)
        localStorage.removeItem('recording_recovery_state')
      }
    }

    // Check after a short delay to ensure backup service is initialized
    setTimeout(checkRecoveryState, 1000)
  }, [])

  // ✅ Request wake lock to prevent screen sleep (mobile support)
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen')
        wakeLockRef.current = wakeLock
        
        // Handle wake lock release (e.g., user presses power button)
        const handleRelease = async () => {
          console.log('⚠️ Wake lock released - screen may sleep')
          wakeLockRef.current = null
          
          // On mobile, try to re-acquire wake lock if still recording
          // Check mediaRecorder state instead of React state (which may be stale)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
            if (!isIOS) {
              // Android: Try to re-acquire after a short delay
              setTimeout(async () => {
                try {
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    const newWakeLock = await (navigator as any).wakeLock.request('screen')
                    wakeLockRef.current = newWakeLock
                    newWakeLock.addEventListener('release', handleRelease)
                    console.log('✅ Wake lock re-acquired')
                  }
                } catch (reacquireError) {
                  console.warn('Failed to re-acquire wake lock:', reacquireError)
                }
              }, 500)
            } else {
              // iOS: Warn user
              toast('⚠️ Keep screen on! Recording may pause if screen locks', {
                icon: '📱',
                duration: 6000,
              })
            }
          }
        }
        
        wakeLock.addEventListener('release', handleRelease)
        console.log('✅ Wake lock acquired - screen will stay awake')
        
        // Mobile-specific: Show warning if on iOS
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isIOS) {
          toast('📱 Keep app open and screen on for best results on iPhone', {
            icon: '📱',
            duration: 6000,
          })
        }
      } else {
        // Wake Lock not supported - show mobile warning
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        if (isMobile) {
          toast('⚠️ Keep screen on during recording!', {
            icon: '📱',
            duration: 5000,
          })
        }
      }
    } catch (err) {
      console.warn('Wake Lock API not supported or failed:', err)
      // Not critical, continue recording
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        toast('⚠️ Keep screen on during recording!', {
          icon: '📱',
          duration: 5000,
        })
      }
    }
  }

  // Release wake lock
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log('✅ Wake lock released')
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
    // Validate project is selected
    if (!selectedProjectId) {
      toast.error('Please select a project first!')
      return
    }

    try {
      // ✅ Initialize backup service
      await recordingBackupService.init()
      
      // ✅ Generate session ID for backup tracking
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionIdRef.current = newSessionId
      chunkIndexRef.current = 0
      chunksBackedUpRef.current = 0

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      let mediaRecorder: MediaRecorder
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 64000,
      }

      try {
        mediaRecorder = new MediaRecorder(stream, recorderOptions)
      } catch (error) {
        console.warn('Falling back to default MediaRecorder options:', error)
        mediaRecorder = new MediaRecorder(stream)
      }
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // ✅ Request wake lock to prevent screen sleep
      await requestWakeLock()

      // ✅ Save chunks to IndexedDB for backup (prevents data loss)
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const chunk = event.data
          audioChunksRef.current.push(chunk)
          
          // 💾 BACKUP: Save chunk to IndexedDB immediately (prevents data loss)
          const currentChunkIndex = chunkIndexRef.current
          chunkIndexRef.current++
          
          try {
            await recordingBackupService.saveChunk({
              sessionId: newSessionId,
              chunkIndex: currentChunkIndex,
              blob: chunk,
              timestamp: Date.now(),
              uploaded: false
            })
            chunksBackedUpRef.current++
            console.log(`💾 Chunk ${currentChunkIndex} backed up to IndexedDB`)
          } catch (backupError) {
            console.error('Failed to backup chunk to IndexedDB:', backupError)
            // Continue even if backup fails
          }
        }
      }

      mediaRecorder.onstop = async () => {
        // ✅ Clear periodic state save interval
        if ((mediaRecorderRef.current as any)?._stateSaveInterval) {
          clearInterval((mediaRecorderRef.current as any)._stateSaveInterval)
          delete (mediaRecorderRef.current as any)._stateSaveInterval
        }
        
        // ✅ Release wake lock
        await releaseWakeLock()
        
        // ✅ Update session status in backup
        if (sessionIdRef.current) {
          await recordingBackupService.saveSession({
            sessionId: sessionIdRef.current,
            userId: user?.id || 'demo-user',
            projectId: selectedProjectId,
            startTime: Date.now(),
            chunks: [],
            uploadedChunks: [],
            status: 'stopped'
          })
        }
        
        // ✅ Final state save to localStorage
        if (sessionIdRef.current && chunksBackedUpRef.current > 0) {
          try {
            localStorage.setItem('recording_recovery_state', JSON.stringify({
              sessionId: sessionIdRef.current,
              chunksBackedUp: chunksBackedUpRef.current,
              recordingTime: recordingTimeRef.current, // Use ref for current value
              timestamp: Date.now(),
              projectId: selectedProjectId,
              completed: true // Mark as completed
            }))
          } catch (e) {
            console.warn('Failed to save final recovery state:', e)
          }
        }
        
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        console.log(`✅ Recording stopped. ${chunksBackedUpRef.current} chunks backed up to IndexedDB`)
        
        // Automatically start upload and processing
        // Small delay to ensure state is updated
        setTimeout(() => {
          handleUploadWithBlob(blob)
        }, 100)
      }

      // ✅ Request data every second for real-time chunking
      // This is important for long recordings (30+ minutes to 1+ hour) to prevent memory issues
      // Chunks are collected in memory AND backed up to IndexedDB for safety
      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimeRef.current = 0 // Reset ref
      
      // ✅ Save session metadata to backup service
      await recordingBackupService.saveSession({
        sessionId: newSessionId,
        userId: user?.id || 'demo-user',
        projectId: selectedProjectId,
        startTime: Date.now(),
        chunks: [],
        uploadedChunks: [],
        status: 'recording'
      })
      
      // ✅ Periodic state save to localStorage (every 30 seconds) as backup
      const stateSaveInterval = setInterval(() => {
        if (sessionIdRef.current && chunksBackedUpRef.current > 0) {
          try {
            localStorage.setItem('recording_recovery_state', JSON.stringify({
              sessionId: sessionIdRef.current,
              chunksBackedUp: chunksBackedUpRef.current,
              recordingTime: recordingTimeRef.current, // Use ref for current value
              timestamp: Date.now(),
              projectId: selectedProjectId
            }))
            console.log(`💾 State saved: ${recordingTimeRef.current}s, ${chunksBackedUpRef.current} chunks`)
          } catch (e) {
            console.warn('Failed to save recovery state:', e)
          }
        }
      }, 30000) // Every 30 seconds
      
      // Store interval ID to clear on stop
      ;(mediaRecorderRef.current as any)._stateSaveInterval = stateSaveInterval
      
      toast.success('🎙️ Recording started - Protected against data loss!', {
        duration: 4000,
      })
      toast('💾 Chunks are being saved automatically - safe from crashes & battery death', {
        icon: '💾',
        duration: 5000,
      })
      
      // Mobile-specific warning
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        toast('📱 Keep app open for best results on mobile', {
          icon: '📱',
          duration: 6000,
        })
      }
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
      await releaseWakeLock()
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // Wake lock will be released in onstop handler
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
    console.log('User authenticated:', !!user)
    console.log('Device info:', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      online: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown'
    })
    
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

    if (!user?.id) {
      console.error('❌ No user ID - User may not be logged in on this device')
      console.error('   User object:', user)
      toast.error('You must be logged in to save recordings. Please log in and try again.', {
        duration: 5000,
      })
      return
    }
    
    // ✅ Check network connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.error('❌ No internet connection')
      toast.error('No internet connection. Please check your network and try again.', {
        duration: 5000,
      })
      return
    }

    try {
      setUploading(true)
      setProcessingStatus('Uploading recording...')
      
      // ✅ Use the recordings API for consistent upload behavior
      const tempTitle = `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
      
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('title', tempTitle)
      formData.append('duration', recordingTime.toString())
      formData.append('userId', user.id)
      formData.append('projectId', selectedProjectId)
      
      // ✅ For large files (>4MB), upload directly to Supabase Storage to avoid Next.js body size limits
      // Vercel has a 4.5MB body size limit, so we use 4MB as threshold for safety
      // This is especially important for long recordings (30+ minutes to 1+ hour)
      const fileSizeMB = blob.size / 1024 / 1024
      const useDirectUpload = fileSizeMB > 4
      
      // Log file size for long recordings
      if (fileSizeMB > 50) {
        console.log(`📊 Large recording detected: ${fileSizeMB.toFixed(2)}MB (likely ${Math.round(recordingTime / 60)} minutes)`)
      }
      
      console.log(`📤 Uploading ${useDirectUpload ? 'directly to Supabase' : 'via /api/recordings'}...`)
      console.log('   File size:', blob.size, 'bytes (', fileSizeMB.toFixed(2), 'MB)')
      console.log('   Upload method:', useDirectUpload ? 'Direct to Supabase' : 'Via API route')
      
      let result
      
      if (useDirectUpload) {
        // ✅ Direct upload to Supabase Storage (bypasses Next.js body size limit)
        console.log('📤 Using direct Supabase upload for large file...')
        
        const timestamp = Date.now()
        const fileName = `recording_${timestamp}.webm`
        const filePath = `recordings/${user.id}/${fileName}`
        
        // Upload directly to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('meeting-recordings')
          .upload(filePath, blob, {
            contentType: 'audio/webm',
            upsert: false,
          })
        
        if (uploadError) {
          console.error('❌ Direct upload failed:', uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }
        
        console.log('✅ File uploaded directly to Supabase Storage')
        
        // Get signed URL for transcription (valid for 1 hour)
        // AssemblyAI needs a publicly accessible URL
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('meeting-recordings')
          .createSignedUrl(filePath, 3600) // 1 hour expiry
        
        let publicUrl
        if (signedUrlError || !signedUrlData) {
          console.warn('⚠️ Failed to create signed URL, trying public URL:', signedUrlError)
          // Fallback to public URL if bucket is public
          const { data: urlData } = supabase.storage
            .from('meeting-recordings')
            .getPublicUrl(filePath)
          publicUrl = urlData.publicUrl
        } else {
          publicUrl = signedUrlData.signedUrl
        }
        
        console.log('✅ Generated URL for transcription:', publicUrl.substring(0, 100) + '...')
        
        // Create recording session via API (metadata only, no file)
        const tempTitle = `Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
        const sessionResponse = await fetch('/api/recordings/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: tempTitle,
            duration: recordingTime,
            userId: user.id,
            projectId: selectedProjectId,
            filePath: filePath,
            fileSize: blob.size,
            recordingUrl: publicUrl,
          }),
        })
        
        if (!sessionResponse.ok) {
          const sessionError = await sessionResponse.json()
          console.error('❌ Failed to create session:', sessionError)
          // Try to clean up uploaded file
          await supabase.storage.from('meeting-recordings').remove([filePath])
          throw new Error(`Failed to create recording session: ${sessionError.error || 'Unknown error'}`)
        }
        
        result = await sessionResponse.json()
        console.log('✅ Recording session created:', result.session.id)
      } else {
        // ✅ Use API route for smaller files (simpler, has retry logic)
        const response = await fetch('/api/recordings', {
          method: 'POST',
          body: formData,
        })

        console.log('📡 Upload response status:', response.status)
        console.log('   Response OK:', response.ok)
        
        try {
          result = await response.json()
          console.log('📡 Upload response data:', result)
        } catch (parseError) {
          // Handle non-JSON responses (like 413 errors)
          const text = await response.text()
          console.error('❌ Failed to parse response as JSON:', parseError)
          console.error('   Raw response:', text.substring(0, 500))
          
          // ✅ If 413 error, retry with direct upload
          if (response.status === 413) {
            console.log('⚠️ File too large for API route (413). Retrying with direct upload...')
            // Fall through to retry with direct upload
            result = null
          } else {
            throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`)
          }
        }

        // ✅ If API route failed with 413 or other error, retry with direct upload
        if (!response.ok || !result) {
          if (response.status === 413 || !result) {
            console.log('⚠️ Upload failed with API route. Retrying with direct Supabase upload...')
            console.log('   File size:', fileSizeMB.toFixed(2), 'MB')
            
            // Retry with direct upload
            const timestamp = Date.now()
            const fileName = `recording_${timestamp}.webm`
            const filePath = `recordings/${user.id}/${fileName}`
            
            // Upload directly to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('meeting-recordings')
              .upload(filePath, blob, {
                contentType: 'audio/webm',
                upsert: false,
              })
            
            if (uploadError) {
              console.error('❌ Direct upload failed:', uploadError)
              throw new Error(`Upload failed: ${uploadError.message}`)
            }
            
            console.log('✅ File uploaded directly to Supabase Storage')
            
            // Get signed URL for transcription (valid for 1 hour)
            // AssemblyAI needs a publicly accessible URL
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('meeting-recordings')
              .createSignedUrl(filePath, 3600) // 1 hour expiry
            
            let publicUrl
            if (signedUrlError || !signedUrlData) {
              console.warn('⚠️ Failed to create signed URL, trying public URL:', signedUrlError)
              // Fallback to public URL if bucket is public
              const { data: urlData } = supabase.storage
                .from('meeting-recordings')
                .getPublicUrl(filePath)
              publicUrl = urlData.publicUrl
            } else {
              publicUrl = signedUrlData.signedUrl
            }
            
            console.log('✅ Generated URL for transcription:', publicUrl.substring(0, 100) + '...')
            
            // Create recording session via API (metadata only, no file)
            const sessionResponse = await fetch('/api/recordings/create-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: tempTitle,
                duration: recordingTime,
                userId: user.id,
                projectId: selectedProjectId,
                filePath: filePath,
                fileSize: blob.size,
                recordingUrl: publicUrl,
              }),
            })
            
            if (!sessionResponse.ok) {
              const sessionError = await sessionResponse.json()
              console.error('❌ Failed to create session:', sessionError)
              // Try to clean up uploaded file
              await supabase.storage.from('meeting-recordings').remove([filePath])
              throw new Error(`Failed to create recording session: ${sessionError.error || 'Unknown error'}`)
            }
            
            result = await sessionResponse.json()
            console.log('✅ Recording session created via direct upload:', result.session.id)
          } else {
            console.error('❌ Upload failed with status:', response.status)
            console.error('   Error details:', result)
            
            const errorMessage = result?.error || result?.details || result?.message || `Upload failed with status ${response.status}`
            throw new Error(errorMessage)
          }
        }

        console.log('✅ Recording uploaded:', result?.session?.id || 'unknown')
      }
      
      // ✅ Trigger transcription (which will then trigger AI processing)
      // Ensure result exists and has recordingUrl before accessing it
      if (result && result.recordingUrl) {
        console.log('🎙️ Starting transcription...')
        console.log('   Recording URL:', result.recordingUrl)
        console.log('   Session ID:', result.session.id)
        setProcessingStatus('Starting transcription...')
        
        try {
          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordingUrl: result.recordingUrl,
              sessionId: result.session.id,
            }),
          })
          
          const transcribeData = await transcribeResponse.json()
          
          if (!transcribeResponse.ok) {
            console.error('❌ Transcription API error:', transcribeResponse.status, transcribeData)
            toast.error('Transcription failed to start. Check console for details.')
          } else {
            console.log('✅ Transcription started:', transcribeData)
          }
        } catch (transcribeError) {
          console.error('❌ Transcription failed to start:', transcribeError)
          toast.error('Failed to start transcription: ' + transcribeError.message)
          // Don't fail the whole upload if transcription fails
        }
      } else {
        console.error('❌ No recordingUrl in result!', result)
        // Try to get recordingUrl from session data if available
        if (result && result.session) {
          console.warn('⚠️ Result has session but no recordingUrl. Attempting to construct URL from file_path...')
          // The API should have returned recordingUrl, but if it didn't, we can't start transcription
          toast.warning('Upload succeeded but transcription URL is missing. Recording is saved but transcription may not start automatically.')
        } else {
          console.error('❌ Result is undefined or missing session!')
          toast.error('Upload succeeded but result structure is invalid')
        }
      }

      // Show appropriate message based on file size
      if (fileSizeMB > 50) {
        toast.success(`✅ Large recording uploaded (${fileSizeMB.toFixed(1)}MB)! Transcription and AI processing will begin shortly.`, {
          duration: 6000,
        })
      } else {
        toast.success('✅ Recording uploaded! AI processing will begin shortly.')
      }
      setProcessingStatus('AI processing in progress...')
      
      // ✅ Start client-side polling to show recording in list and track processing
      const sessionId = result.session.id
      console.log('🔄 Starting client-side polling for session:', sessionId)
      startClientSidePolling(sessionId)
      
      // ✅ Trigger a custom event to notify pages to refresh their meetings list
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recording-uploaded', { 
          detail: { sessionId } 
        }))
      }
      
      // Close and reset immediately so user can continue
      onRecordingComplete()
      onClose()
      resetState()
      
    } catch (error) {
      console.error('❌ UPLOAD FAILED:', error)
      console.error('Error type:', error?.constructor?.name || typeof error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'N/A')
      
      // ✅ More detailed error messages for common issues
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Check for specific error types
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error: Please check your internet connection and try again.'
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication error: Please log in again and try recording.'
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          errorMessage = 'File too large: Maximum size is 50MB. Try a shorter recording.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Upload timeout: Please check your internet connection and try again.'
        }
      }
      
      toast.error(`Failed to upload recording: ${errorMessage}`, {
        duration: 6000,
        icon: '❌',
      })
      
      // ✅ Keep the recording blob so user can try again
      setUploading(false)
      setProcessingStatus(`Upload failed: ${errorMessage}`)
      
      // Don't reset state - allow user to retry by clicking "Stop Recording" again
      // The blob is still available, so they can try uploading again
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
            
            {/* Error state with retry button */}
            {!isRecording && audioBlob && !uploading && processingStatus && processingStatus.includes('failed') && (
              <div className="mb-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 text-xl">❌</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 mb-1">
                        Upload Failed
                      </p>
                      <p className="text-xs text-red-700 mb-3">
                        {processingStatus}
                      </p>
                      <button
                        onClick={() => {
                          if (audioBlob) {
                            setProcessingStatus('Retrying upload...')
                            handleUploadWithBlob(audioBlob)
                          }
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Retry Upload
                      </button>
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

