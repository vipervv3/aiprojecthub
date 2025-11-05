'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/app-layout'
import RequireAuth from '@/components/auth/require-auth'
import { ArrowLeft, Calendar, Clock, FileText, CheckSquare, Loader, AlertCircle, Trash2, Edit2, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

// Helper to reload meeting data
const reloadMeetingData = () => {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

interface Meeting {
  id: string
  title: string
  description?: string
  scheduled_at: string
  duration?: number
  summary?: string
  action_items?: any[]
  ai_insights?: any
  created_at: string
  projects?: {
    id: string
    name: string
    status: string
  }
}

interface RecordingSession {
  id: string
  transcription_text?: string
  transcription_confidence?: number
  transcription_status: string
}

interface Task {
  id: string
  title: string
  description: string
  priority: string
  status: string
  due_date?: string
  is_ai_generated?: boolean
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [recording, setRecording] = useState<RecordingSession | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'tasks'>('summary')

  useEffect(() => {
    if (meetingId) {
      loadMeetingData()
    }
  }, [meetingId])

  const loadMeetingData = async () => {
    try {
      setLoading(true)

      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // ✅ Handle "recording-" prefix - strip it before querying
      let actualMeetingId = meetingId
      let recordingSessionId: string | null = null
      let isRecordingSession = false
      
      if (meetingId.startsWith('recording-')) {
        recordingSessionId = meetingId.replace('recording-', '')
        isRecordingSession = true
        console.log('🔧 Detected recording session ID, stripped prefix:', recordingSessionId)
      }

      // Load meeting with recording session and project joined
      console.log('📋 Loading meeting:', meetingId, '→ actual ID:', actualMeetingId)
      
      let meetingData = null
      let meetingError = null
      
      // First, try to load as a meeting ID (only if not a recording- prefix)
      if (!isRecordingSession) {
        // Use regular left join (not inner join) to avoid 406 errors
        const result = await supabase
          .from('meetings')
          .select(`
            *,
            recording_sessions (
              id,
              user_id,
              transcription_status,
              transcription_text,
              transcription_confidence,
              duration,
              created_at,
              updated_at,
              metadata
            )
          `)
          .eq('id', actualMeetingId)
          .maybeSingle()
        
        meetingData = result.data
        meetingError = result.error

        // Handle 406 errors gracefully (this happens when maybeSingle() returns 0 rows in some Supabase versions)
        if (meetingError && (meetingError.code === 'PGRST116' || meetingError.message?.includes('0 rows') || meetingError.message?.includes('Cannot coerce'))) {
          console.log('⚠️ Meeting not found (406 error), this might be a recording session ID')
          meetingError = null // Reset to check for recording session
          meetingData = null
        }

        // If we have meeting data, load project separately
        if (meetingData && meetingData.project_id) {
          const { data: projectData } = await supabase
            .from('projects')
            .select('id, name, status')
            .eq('id', meetingData.project_id)
            .maybeSingle()
          
          if (projectData) {
            meetingData.projects = projectData
          }
        }
      }

      // If not found as meeting, check if it's a recording session ID
      if ((!meetingData && !meetingError) || isRecordingSession) {
        if (!recordingSessionId) {
          recordingSessionId = meetingId
        }
        
        console.log('⚠️ Not found as meeting ID, checking if it\'s a recording session ID:', recordingSessionId)
        const { data: recordingSession, error: sessionError } = await supabase
          .from('recording_sessions')
          .select('*')
          .eq('id', recordingSessionId)
          .maybeSingle()
        
        if (recordingSession && !sessionError) {
          console.log('✅ Found as recording session')
          
          // Show the recording session even if it's still being processed
          // Create a temporary meeting object for display
          const tempMeeting: Meeting = {
            id: `recording-${recordingSessionId}`,
            title: recordingSession.title || `Recording - ${new Date(recordingSession.created_at).toLocaleDateString()}`,
            description: recordingSession.transcription_status === 'completed' 
              ? 'Ready for processing' 
              : recordingSession.transcription_status === 'processing'
              ? 'Transcribing...'
              : 'Pending transcription',
            scheduled_at: recordingSession.created_at,
            duration: recordingSession.duration || 0,
            summary: recordingSession.transcription_text || undefined,
            action_items: [],
            ai_insights: {
              transcription_status: recordingSession.transcription_status,
              transcription_confidence: recordingSession.transcription_confidence
            },
            created_at: recordingSession.created_at
          }
          
          setMeeting(tempMeeting)
          setRecording({
            id: recordingSession.id,
            transcription_text: recordingSession.transcription_text,
            transcription_confidence: recordingSession.transcription_confidence,
            transcription_status: recordingSession.transcription_status
          })
          setLoading(false)
          
          // If transcription is complete but not processed, try to process it
          if (recordingSession.transcription_status === 'completed' && recordingSession.transcription_text && !recordingSession.ai_processed) {
            // Get current user
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            const projectId = recordingSession.metadata?.projectId || null
            
            // Try to process it in background
            fetch('/api/process-recording', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: recordingSessionId,
                userId: currentUser?.id,
                projectId: projectId
              })
            })
            .then(response => {
              if (response.ok) {
                toast.success('Recording processed! Reloading...')
                setTimeout(() => {
                  window.location.reload()
                }, 2000)
              } else {
                console.error('Processing failed:', response.status)
              }
            })
            .catch(error => {
              console.error('Error processing recording:', error)
            })
          }
          
          return
        } else {
          // Not a recording session either - truly not found
          console.error('❌ Meeting not found:', meetingId)
          console.error('   Not found in meetings table')
          console.error('   Not found in recording_sessions table')
          toast.error('Meeting not found')
          router.push('/meetings')
          return
        }
      }

      // Final validation
      if (meetingError && meetingError.code !== 'PGRST116') {
        console.error('❌ Error loading meeting:', meetingError)
        toast.error('Failed to load meeting: ' + meetingError.message)
        router.push('/meetings')
        return
      }
      
      if (!meetingData) {
        console.error('❌ Meeting data is null after all checks')
        toast.error('Meeting not found')
        router.push('/meetings')
        return
      }
      
      // ✅ SECURITY CHECK: Verify user owns this meeting through recording session
      if (meetingData.recording_sessions) {
        const session = Array.isArray(meetingData.recording_sessions) 
          ? meetingData.recording_sessions[0] 
          : meetingData.recording_sessions
        
        // Get current user from auth
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (session && session.user_id !== currentUser?.id) {
          console.error('❌ Unauthorized: User does not own this meeting')
          throw new Error('You do not have permission to view this meeting')
        }
      }
      console.log('✅ Meeting loaded')
      console.log('   Summary:', meetingData.summary ? 'YES' : 'NO')
      console.log('   AI Insights:', meetingData.ai_insights ? 'YES' : 'NO')
      console.log('   Recording Session ID:', meetingData.recording_session_id || 'NONE')
      
      setMeeting(meetingData)

      // Load recording session - try multiple methods
      console.log('🎙️ Loading recording session...')
      let recordingData = null

      // Method 1: Use recording_session_id from meeting if available
      if (meetingData.recording_session_id) {
        console.log('   Trying direct link via recording_session_id:', meetingData.recording_session_id)
        const { data: directLinkData, error: directLinkError } = await supabase
          .from('recording_sessions')
          .select('*')
          .eq('id', meetingData.recording_session_id)
          .maybeSingle()

        if (directLinkError) {
          console.log('   ⚠️ Direct link error:', directLinkError.message)
        } else if (directLinkData) {
          console.log('   ✅ Found via direct link')
          recordingData = directLinkData
        }
      }

      // Method 2: Check if recording_sessions was joined in the query
      if (!recordingData && meetingData.recording_sessions) {
        const joinedSessions = Array.isArray(meetingData.recording_sessions) 
          ? meetingData.recording_sessions 
          : [meetingData.recording_sessions]
        
        if (joinedSessions.length > 0 && joinedSessions[0]) {
          console.log('   ✅ Found via joined query')
          recordingData = joinedSessions[0]
        }
      }

      // Method 3: Fallback to metadata query
      if (!recordingData) {
        console.log('   Trying metadata query...')
        const { data: metadataData, error: metadataError } = await supabase
          .from('recording_sessions')
          .select('*')
          .eq('metadata->>meetingId', meetingId)
          .maybeSingle()

        if (metadataError) {
          console.log('   ⚠️ Metadata query error:', metadataError.message)
        } else if (metadataData) {
          console.log('   ✅ Found via metadata query')
          recordingData = metadataData
        }
      }

      if (recordingData) {
        console.log('✅ Recording session found')
        console.log('   Status:', recordingData.transcription_status)
        console.log('   Has transcript:', recordingData.transcription_text ? 'YES (' + recordingData.transcription_text.length + ' chars)' : 'NO')
        setRecording(recordingData)
      } else {
        console.log('⚠️ No recording session found with any method')
        setRecording(null)
      }

      // Load tasks
      console.log('✅ Loading tasks...')
      const { data: taskData, error: taskError } = await supabase
        .from('meeting_tasks')
        .select(`
          task_id,
          tasks (*)
        `)
        .eq('meeting_id', meetingId)

      if (taskError) {
        console.log('❌ Tasks error:', taskError.message)
      } else {
        console.log('✅ Tasks loaded:', taskData?.length || 0)
      }

      if (!taskError && taskData) {
        setTasks(taskData.map((mt: any) => mt.tasks))
      }
    } catch (error) {
      console.error('Error loading meeting data:', error)
      toast.error('Failed to load meeting details')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMeeting = async () => {
    if (!confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      console.log('🗑️ Deleting meeting:', meetingId)

      // Call API route to delete (uses service role key)
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete meeting')
      }

      console.log('✅ Meeting deleted successfully')
      toast.success('Meeting deleted successfully')
      router.push('/meetings')
    } catch (error: any) {
      console.error('❌ Error deleting meeting:', error)
      toast.error(error.message || 'Failed to delete meeting')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'todo': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <AppLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        </AppLayout>
      </RequireAuth>
    )
  }

  if (!meeting) {
    return (
      <RequireAuth>
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Meeting Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">The meeting you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/meetings')}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 touch-manipulation"
            >
              Back to Meetings
            </button>
          </div>
        </AppLayout>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <AppLayout>
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <button
              onClick={() => router.push('/meetings')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meetings
            </button>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation"
              >
                <Edit2 className="h-4 w-4" />
                Edit Meeting
              </button>
              <button
                onClick={handleDeleteMeeting}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete Meeting'}
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{meeting.title}</h1>
              {meeting.ai_insights && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">
                    AI-Generated Title • {meeting.ai_insights.tasks_extracted || 0} tasks extracted
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(meeting.scheduled_at)}</span>
            </div>
            {meeting.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{meeting.duration} minutes</span>
              </div>
            )}
            {recording?.transcription_confidence && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Transcription: {Math.round(recording.transcription_confidence * 100)}% confidence</span>
              </div>
            )}
          </div>
          
          {/* Project Context */}
          {meeting.projects && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-medium">
                <span>📁</span>
                <span>Project: {meeting.projects.name || 'Unknown'}</span>
              </div>
            </div>
          )}

          {meeting.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-4">{meeting.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <div className="flex gap-4 sm:gap-6 min-w-max">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === 'summary'
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === 'transcript'
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => {
                setActiveTab('tasks')
                loadMeetingData() // Refresh to get latest tasks
              }}
              className={`pb-3 border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
                activeTab === 'tasks'
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Tasks ({tasks.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'summary' && (
          <div className="space-y-4 sm:space-y-6">
            {/* AI Summary */}
            {meeting.summary && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Meeting Summary
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">{meeting.summary}</p>
              </div>
            )}

            {/* Key Points */}
            {meeting.ai_insights?.keyPoints && meeting.ai_insights.keyPoints.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Points</h2>
                <ul className="space-y-2">
                  {meeting.ai_insights.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Action Items ({meeting.action_items.length})
                </h2>
                <ul className="space-y-3">
                  {meeting.action_items.map((item: any, index: number) => {
                    // Safely extract values - handle all possible formats
                    let title = 'Untitled action item'
                    let description: string | null = null
                    let priority: string | null = null
                    let completed = false
                    
                    if (typeof item === 'string') {
                      title = item
                    } else if (item && typeof item === 'object') {
                      title = String(item.title || item.description || item.name || 'Untitled action item')
                      description = item.description && typeof item.description === 'string' ? item.description : null
                      priority = item.priority && typeof item.priority === 'string' ? item.priority : null
                      completed = Boolean(item.completed)
                    }
                    
                    // Ensure title is always a string (never render object)
                    if (typeof title !== 'string') {
                      title = String(title || 'Untitled action item')
                    }
                    
                    return (
                      <li key={index} className={`flex items-start gap-3 p-3 rounded-lg ${completed ? 'bg-gray-50 dark:bg-gray-700/50 opacity-75' : 'bg-green-50 dark:bg-green-900/20'}`}>
                        <CheckSquare className={`h-5 w-5 mt-0.5 flex-shrink-0 ${completed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm sm:text-base font-medium ${completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {title}
                            </p>
                            {priority && typeof priority === 'string' && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(priority)}`}>
                                {priority}
                              </span>
                            )}
                          </div>
                          {description && typeof description === 'string' && (
                            <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${completed ? 'line-through' : ''}`}>
                              {description}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            {recording?.transcription_text ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Full Transcript
                  </h2>
                  {recording.transcription_confidence && (
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Confidence: {Math.round(recording.transcription_confidence * 100)}%
                    </span>
                  )}
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 max-h-96 sm:max-h-[600px] overflow-y-auto">
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {recording.transcription_text}
                  </p>
                </div>
                <button
                  onClick={loadMeetingData}
                  className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2 touch-manipulation"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Transcript
                </button>
              </>
            ) : recording?.transcription_status === 'processing' ? (
              <div className="text-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Transcription in progress...</p>
                <button
                  onClick={loadMeetingData}
                  className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 touch-manipulation"
                >
                  Check Again
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No transcript available</p>
                {recording && (
                  <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Status: {recording.transcription_status || 'unknown'}
                  </div>
                )}
                <button
                  onClick={loadMeetingData}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2 mx-auto touch-manipulation"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                        {task.is_ai_generated && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            AI Generated
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)} dark:bg-opacity-80`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} dark:bg-opacity-80`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{task.description}</p>
                      {task.due_date && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
                <CheckSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No tasks generated from this meeting yet</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Meeting Modal */}
        {editing && meeting && (
          <EditMeetingModal
            meeting={meeting}
            onClose={() => setEditing(false)}
            onSave={async (updatedData) => {
              try {
                if (!supabase) {
                  toast.error('Unable to update meeting')
                  return
                }

                const { error } = await supabase
                  .from('meetings')
                  .update(updatedData)
                  .eq('id', meetingId)

                if (error) {
                  console.error('Error updating meeting:', error)
                  toast.error('Failed to update meeting')
                  return
                }

                toast.success('Meeting updated successfully')
                setEditing(false)
                loadMeetingData() // Reload the meeting data
              } catch (error) {
                console.error('Error updating meeting:', error)
                toast.error('Failed to update meeting')
              }
            }}
          />
        )}
      </div>
    </AppLayout>
    </RequireAuth>
  )
}

// Edit Meeting Modal Component
const EditMeetingModal: React.FC<{
  meeting: Meeting
  onClose: () => void
  onSave: (data: any) => void
}> = ({ meeting, onClose, onSave }) => {
  const scheduledDate = new Date(meeting.scheduled_at)
  const endTime = meeting.duration ? new Date(scheduledDate.getTime() + meeting.duration * 60000) : new Date(scheduledDate.getTime() + 60 * 60000)

  const [formData, setFormData] = useState({
    title: meeting.title || '',
    description: meeting.description || '',
    date: scheduledDate.toISOString().split('T')[0],
    startTime: scheduledDate.toTimeString().substring(0, 5),
    endTime: endTime.toTimeString().substring(0, 5),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const scheduledAt = new Date(`${formData.date}T${formData.startTime}`)
    const endTime = new Date(`${formData.date}T${formData.endTime}`)
    const duration = Math.round((endTime.getTime() - scheduledAt.getTime()) / 60000)

    onSave({
      title: formData.title,
      description: formData.description,
      scheduled_at: scheduledAt.toISOString(),
      duration,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Edit Meeting</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 touch-manipulation"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

