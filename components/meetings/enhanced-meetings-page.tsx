'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Video, MapPin, Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { dataService } from '@/lib/data-service'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Meeting {
  id: string
  title: string
  description: string
  date: string
  start_time: string
  end_time: string
  location?: string
  meeting_type: 'in_person' | 'video_call' | 'phone_call'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  attendees: string[]
  project_id?: string
  agenda: string[]
  notes?: string
  recording_url?: string
  created_at: string
  updated_at: string
}

interface ViewMeetingModalProps {
  meeting: Meeting
  onClose: () => void
  onEdit: (meeting: Meeting) => void
  onDelete: (meetingId: string) => void
}

const ViewMeetingModal: React.FC<ViewMeetingModalProps> = ({ meeting, onClose, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'in_progress': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call': return <Video className="h-4 w-4" />
      case 'in_person': return <MapPin className="h-4 w-4" />
      case 'phone_call': return <Users className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{meeting.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(meeting.status)}`}>
              {meeting.status.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {getTypeIcon(meeting.meeting_type)}
              <span className="capitalize text-xs sm:text-sm">{meeting.meeting_type.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{meeting.date}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{meeting.start_time} - {meeting.end_time}</p>
              </div>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Location</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{meeting.location}</p>
                </div>
              </div>
            )}
          </div>

          {meeting.description && (
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{meeting.description}</p>
            </div>
          )}

          {meeting.attendees.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Attendees</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees.map((attendee, index) => (
                  <span key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meeting.agenda.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Agenda</h3>
              <ol className="space-y-2">
                {meeting.agenda.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3">
                    <span className="bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {meeting.notes && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Transcript
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {meeting.notes || 'No transcript available yet. Please wait for transcription to complete.'}
                </p>
              </div>
            </div>
          )}
          
          {!meeting.notes && meeting.recording_url && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏳ Transcript is being processed. Please check back in a few minutes.
              </p>
            </div>
          )}

          {meeting.recording_url && (
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Recording</h3>
              <a
                href={meeting.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs sm:text-sm touch-manipulation"
              >
                View Recording
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onDelete(meeting.id)}
            className="w-full sm:w-auto px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
          >
            Delete
          </button>
          <button
            onClick={() => onEdit(meeting)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 touch-manipulation"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedMeetingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (user) {
      loadMeetings()
      
      // ✅ Client-side polling for transcriptions in progress
      const pollInterval = setInterval(async () => {
        // Only poll if we have recordings that are still transcribing
        const transcribingRecordings = meetings.filter((m: any) => 
          m._transcriptionStatus === 'pending' || m._transcriptionStatus === 'processing'
        )
        
        if (transcribingRecordings.length > 0) {
          console.log(`🔄 Checking ${transcribingRecordings.length} recording(s) for transcription updates...`)
          
          // Check each recording's transcription status
          for (const meeting of transcribingRecordings) {
            if (meeting._recordingSessionId) {
              try {
                const response = await fetch('/api/check-transcription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: meeting._recordingSessionId
                  })
                })
                
                if (response.ok) {
                  const data = await response.json()
                  if (data.status === 'completed') {
                    console.log(`✅ Transcription completed for ${meeting._recordingSessionId}`)
                    // Reload meetings to show updated status
                    setTimeout(() => loadMeetings(), 1000)
                  }
                }
              } catch (error) {
                console.error(`Error checking transcription for ${meeting._recordingSessionId}:`, error)
              }
            }
          }
        }
      }, 15000) // Poll every 15 seconds
      
      return () => clearInterval(pollInterval)
    }
  }, [user, meetings])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      
      // ✅ SECURITY FIX: Only load recording sessions for current user
      const { supabase } = await import('@/lib/supabase')
      
      if (supabase && user?.id) {
        // Load user's recording sessions directly (not meetings)
        const { data: recordingSessions, error: sessionsError } = await supabase
          .from('recording_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (sessionsError) {
          console.error('Error loading recording sessions:', sessionsError)
          toast.error('Failed to load recordings: ' + sessionsError.message)
          setMeetings([])
          setLoading(false)
          return
        }
        
        console.log(`📹 Loaded ${recordingSessions?.length || 0} recording sessions from Supabase`)
        
        if (!recordingSessions || recordingSessions.length === 0) {
          console.log('No recording sessions found for user')
          setMeetings([])
          setLoading(false)
          return
        }
        
        // Load associated meetings for these recording sessions (optional - for additional metadata)
        const sessionIds = recordingSessions.map((s: any) => s.id)
        const { data: meetingsData, error: meetingsError } = await supabase
          .from('meetings')
          .select('*')
          .in('recording_session_id', sessionIds)
        
        if (meetingsError) {
          console.log('⚠️ Error loading meetings (optional):', meetingsError.message)
        }
        
        // Create a map of meetings by recording_session_id for quick lookup
        const meetingsMap = new Map()
        if (meetingsData) {
          meetingsData.forEach((m: any) => {
            if (m.recording_session_id) {
              meetingsMap.set(m.recording_session_id, m)
            }
          })
        }
        
        console.log(`📹 Found ${meetingsMap.size} meetings associated with recordings`)
        
        // Transform recording sessions to Meeting format
        // ✅ Show ALL recordings - including those still being processed
        const transformedMeetings: Meeting[] = recordingSessions
          .map((session: any) => {
            const associatedMeeting = meetingsMap.get(session.id)
            const createdDate = new Date(session.created_at)
            
            // ✅ IMPORTANT: Must use meeting ID if it exists
            const meetingId = associatedMeeting?.id
            
            // Determine status based on transcription and AI processing
            const transcriptionStatus = session.transcription_status || 'pending'
            const isTranscribing = transcriptionStatus === 'pending' || transcriptionStatus === 'processing'
            const isTranscriptionComplete = transcriptionStatus === 'completed' && session.transcription_text
            const isOrphaned = !meetingId && isTranscriptionComplete && !session.ai_processed
            
            // Show appropriate status message
            let statusMessage = ''
            if (isTranscribing) {
              statusMessage = '⏳ Transcribing...'
            } else if (isOrphaned) {
              statusMessage = '⏳ Processing...'
            } else if (meetingId) {
              statusMessage = associatedMeeting?.summary || ''
            }
            
            // Determine meeting status
            let meetingStatus: 'processing' | 'completed' = 'completed'
            if (isTranscribing || isOrphaned) {
              meetingStatus = 'processing'
            }
            
            if (isOrphaned) {
              console.warn(`⚠️ Recording session ${session.id} has completed transcription but no meeting. Auto-processing...`)
            }
            
            return {
              id: meetingId || `recording-${session.id}`, // Use prefixed ID for orphaned recordings
              title: associatedMeeting?.title || session.title || `Recording - ${createdDate.toLocaleDateString()}`,
              description: associatedMeeting?.description || statusMessage,
              date: createdDate.toISOString().split('T')[0],
              start_time: createdDate.toTimeString().slice(0, 5),
              end_time: new Date(createdDate.getTime() + (session.duration || 30) * 60000).toTimeString().slice(0, 5),
              location: associatedMeeting?.location || '',
              meeting_type: 'video_call',
              status: meetingStatus,
              attendees: Array.isArray(associatedMeeting?.attendees) ? associatedMeeting.attendees : [],
              project_id: associatedMeeting?.project_id || session.metadata?.projectId,
              agenda: Array.isArray(associatedMeeting?.action_items) ? associatedMeeting.action_items : [],
              notes: session.transcription_text || associatedMeeting?.summary || '',
              recording_url: associatedMeeting?.recording_url,
              created_at: session.created_at,
              updated_at: session.updated_at,
              _isOrphaned: isOrphaned, // Internal flag
              _recordingSessionId: session.id, // Store for processing
              _transcriptionStatus: transcriptionStatus // Store transcription status
            }
          })
        
        console.log(`✅ Transformed ${transformedMeetings.length} recordings for display`)
        if (transformedMeetings.length > 0) {
          console.log('Sample recording:', transformedMeetings[0])
        }
        
        // ✅ AUTO-PROCESS: Automatically trigger processing for orphaned recordings (only if transcription is complete)
        const orphanedRecordings = transformedMeetings.filter((m: any) => 
          m._isOrphaned && 
          m._recordingSessionId && 
          m._transcriptionStatus === 'completed'
        )
        if (orphanedRecordings.length > 0) {
          console.log(`🔄 Auto-processing ${orphanedRecordings.length} orphaned recording(s)...`)
          
          // Process them in parallel (don't await - let it run in background)
          Promise.all(orphanedRecordings.map(async (meeting: any) => {
            const sessionId = meeting._recordingSessionId
            try {
              console.log(`🤖 Auto-triggering processing for: ${sessionId}`)
              const response = await fetch('/api/process-recording', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  userId: user?.id,
                  projectId: meeting.project_id
                })
              })
              
              if (response.ok) {
                const result = await response.json()
                console.log(`✅ Auto-processed recording: ${sessionId}`, result)
                // Reload meetings after a short delay to show updated status
                setTimeout(() => {
                  console.log('🔄 Reloading meetings after auto-processing...')
                  loadMeetings()
                }, 3000)
              } else {
                const error = await response.json()
                console.error(`❌ Auto-processing failed for ${sessionId}:`, error)
              }
            } catch (error) {
              console.error(`❌ Error auto-processing ${sessionId}:`, error)
            }
          })).catch(err => {
            console.error('Error in auto-processing batch:', err)
          })
        }
        
        setMeetings(transformedMeetings)
        setLoading(false)
        return
      }
      
      // Fallback to empty if Supabase not available or user not logged in
      console.log('Supabase not available or user not logged in, showing empty meetings list')
      setMeetings([])
      setLoading(false)
    } catch (error) {
      console.error('Error loading meetings:', error)
      toast.error('Failed to load meetings')
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setShowViewModal(true)
  }

  const handleEditMeeting = (meeting: Meeting) => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon')
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return
    }

    try {
      console.log('🗑️ Attempting to delete meeting/recording with ID:', meetingId)
      
      // ✅ Get auth token for API request
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }
      
      // ✅ Use API endpoint for proper deletion with auth & cleanup
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('📡 Delete API response status:', response.status)
      
      const data = await response.json()
      console.log('📡 Delete API response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete recording')
      }

      setMeetings(prev => prev.filter(m => m.id !== meetingId))
      setShowViewModal(false)
      setSelectedMeeting(null)
      toast.success('Recording deleted successfully')
      
      // Reload to ensure we have fresh data
      setTimeout(() => loadMeetings(), 500)
    } catch (error) {
      console.error('❌ Error deleting recording:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete recording')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'in_progress': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call': return <Video className="h-4 w-4" />
      case 'in_person': return <MapPin className="h-4 w-4" />
      case 'phone_call': return <Users className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Recordings</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">View and manage your meeting recordings with AI-generated transcripts and tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadMeetings()
                toast.success('Recordings refreshed')
              }}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 text-sm sm:text-base touch-manipulation"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base touch-manipulation"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Video className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No recordings found</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 px-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start recording meetings using the floating recording button to see them here'
                }
              </p>
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewMeeting(meeting)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 min-w-0">{meeting.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)} whitespace-nowrap`}>
                        {meeting.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        {getTypeIcon(meeting.meeting_type)}
                        <span className="text-xs capitalize">{meeting.meeting_type.replace('_', ' ')}</span>
                      </div>
                      {meeting.notes && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 flex items-center gap-1 whitespace-nowrap">
                          <FileText className="h-3 w-3" />
                          Transcript
                        </span>
                      )}
                    </div>
                    
                    {meeting.description && (
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{meeting.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{meeting.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{meeting.start_time} - {meeting.end_time}</span>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{meeting.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{meeting.attendees.length} attendees</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                    {/* View Details button - navigates to meeting detail page or processes orphaned recording */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        // Check if this is an orphaned recording
                        if ((meeting as any)._isOrphaned && (meeting as any)._recordingSessionId) {
                          const sessionId = (meeting as any)._recordingSessionId
                          console.log('🔄 Processing orphaned recording:', sessionId)
                          toast('Processing recording... This may take a moment.')
                          
                          // Trigger AI processing
                          try {
                            const response = await fetch('/api/process-recording', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                sessionId: sessionId,
                                userId: user?.id,
                                projectId: meeting.project_id || (meeting as any).metadata?.projectId
                              })
                            })
                            
                            if (response.ok) {
                              toast.success('Recording processed! Refreshing...')
                              loadMeetings() // Reload to show the new meeting
                            } else {
                              const error = await response.json()
                              toast.error('Failed to process: ' + (error.error || 'Unknown error'))
                            }
                          } catch (error) {
                            console.error('Error processing recording:', error)
                            toast.error('Failed to process recording')
                          }
                        } else {
                          // Normal meeting - navigate to detail page
                          router.push(`/meetings/${meeting.id}`)
                        }
                      }}
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-2 text-xs sm:text-sm touch-manipulation"
                      title={(meeting as any)._isOrphaned ? "Process recording" : "View transcript and tasks"}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">{(meeting as any)._isOrphaned ? "Process" : "Details"}</span>
                    </button>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteMeeting(meeting.id)
                      }}
                      className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors touch-manipulation"
                      title="Delete recording"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}

      {showViewModal && selectedMeeting && (
        <ViewMeetingModal
          meeting={selectedMeeting}
          onClose={() => {
            setShowViewModal(false)
            setSelectedMeeting(null)
          }}
          onEdit={handleEditMeeting}
          onDelete={handleDeleteMeeting}
        />
      )}
    </div>
  )
}




