'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Sidebar from '@/components/layout/sidebar'
import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import MeetingsHeader from './meetings-header'
import UpcomingMeetings from './upcoming-meetings'
import PastMeetings from './past-meetings'
import UnprocessedRecordings from './unprocessed-recordings'
import { useRecording } from '@/app/recording-provider'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface Meeting {
  id: string
  title: string
  description: string
  scheduled_at: string
  duration: number
  recording_session_id?: string
  summary?: string
  action_items: any[]
  attendees: any[]
  meeting_type: string
  ai_insights: any
  created_at: string
}

interface RecordingSession {
  id: string
  title: string
  duration: number
  transcription_status: string
  transcription_text?: string
  ai_processed: boolean
  created_at: string
}

export default function MeetingsPage() {
  const { user } = useAuth()
  const { startRecording } = useRecording()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [recordingSessions, setRecordingSessions] = useState<RecordingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')

  useEffect(() => {
    if (user) {
      loadMeetings()
      loadRecordingSessions()
      loadProjects()
      
      // Load saved project selection
      const savedProject = localStorage.getItem('recording_project_context')
      if (savedProject) {
        setSelectedProject(savedProject)
      }
    }
    
    // ✅ Listen for recording upload events to auto-refresh
    const handleRecordingUploaded = (event: CustomEvent) => {
      console.log('🔄 Recording uploaded event received, refreshing meetings...')
      setTimeout(() => {
        loadMeetings()
        loadRecordingSessions()
      }, 1000) // Small delay to ensure DB is updated
    }
    
    const handleRecordingProcessed = (event: CustomEvent) => {
      console.log('🔄 Recording processed event received, refreshing meetings...')
      setTimeout(() => {
        loadMeetings()
        loadRecordingSessions()
      }, 1000)
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('recording-uploaded', handleRecordingUploaded as EventListener)
      window.addEventListener('recording-processed', handleRecordingProcessed as EventListener)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('recording-uploaded', handleRecordingUploaded as EventListener)
        window.removeEventListener('recording-processed', handleRecordingProcessed as EventListener)
      }
    }
  }, [user])

  // Save project selection for recording context
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('recording_project_context', selectedProject)
      console.log(`📁 Recording project context set: ${selectedProject}`)
    } else {
      localStorage.removeItem('recording_project_context')
      console.log(`📁 Recording project context cleared`)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user?.id)
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadMeetings = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setMeetings([])
        setLoading(false)
        return
      }
      
      // ✅ SECURITY FIX: Only load meetings for the current user
      // Meetings are linked to recording_sessions which have user_id
      const { data: recordingSessions, error: sessionError } = await supabase
        .from('recording_sessions')
        .select('id')
        .eq('user_id', user.id)

      if (sessionError) throw sessionError

      const sessionIds = recordingSessions?.map((s: any) => s.id) || []
      
      if (sessionIds.length === 0) {
        setMeetings([])
        setLoading(false)
        return
      }

      // Load meetings that belong to user's recording sessions
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          recording_sessions(*)
        `)
        .in('recording_session_id', sessionIds)
        .order('scheduled_at', { ascending: false })

      if (error) throw error

      setMeetings(data || [])
    } catch (error) {
      console.error('Error loading meetings:', error)
      toast.error('Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  const loadRecordingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('recording_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRecordingSessions(data || [])
    } catch (error) {
      console.error('Error loading recording sessions:', error)
    }
  }

  const handleStartRecording = () => {
    startRecording()
  }

  const handleScheduleMeeting = () => {
    // TODO: Open schedule meeting modal
    toast('Schedule meeting functionality coming soon')
  }

  const handleSelectAll = () => {
    if (selectedMeetings.length === meetings.length) {
      setSelectedMeetings([])
    } else {
      setSelectedMeetings(meetings.map(meeting => meeting.id))
    }
  }

  const handleSelectMeeting = (meetingId: string) => {
    setSelectedMeetings(prev => 
      prev.includes(meetingId) 
        ? prev.filter(id => id !== meetingId)
        : [...prev, meetingId]
    )
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return
    }

    try {
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete recording')
      }

      toast.success('Recording deleted successfully')
      loadMeetings()
      loadRecordingSessions()
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete recording')
    }
  }

  const handleDeleteSelectedMeetings = async () => {
    if (selectedMeetings.length === 0) {
      toast.error('No recordings selected')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedMeetings.length} selected recording(s)? This action cannot be undone.`)) {
      return
    }

    try {
      // ✅ Delete each meeting using API endpoint for proper cleanup
      const deletePromises = selectedMeetings.map(meetingId =>
        fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      
      // Check if any failed
      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} recording(s)`)
      }

      toast.success(`${selectedMeetings.length} recording(s) deleted successfully`)
      setSelectedMeetings([])
      loadMeetings()
      loadRecordingSessions()
    } catch (error) {
      console.error('Error deleting meetings:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete recordings')
    }
  }

  const upcomingMeetings = meetings.filter(meeting => 
    new Date(meeting.scheduled_at) > new Date()
  )

  const pastMeetings = meetings.filter(meeting => 
    new Date(meeting.scheduled_at) <= new Date()
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 lg:pl-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MeetingsHeader 
            onStartRecording={handleStartRecording}
            onScheduleMeeting={handleScheduleMeeting}
            selectedCount={selectedMeetings.length}
            totalMeetings={meetings.length}
            onDeleteSelected={handleDeleteSelectedMeetings}
          />

              {/* Project Selector for Recording Context */}
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  📁 Project Context for Recordings
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Project (General)</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Tasks extracted from recordings will be linked to this project
                </p>
              </div>

              {/* Meeting Selection */}
              <div className="mb-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedMeetings.length === meetings.length && meetings.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Select All ({meetings.length} meetings)
                  </span>
                </label>
              </div>

              {/* Unprocessed Recordings */}
              {user && recordingSessions.length > 0 && (
                <UnprocessedRecordings
                  recordings={recordingSessions}
                  userId={user.id}
                  projectId={selectedProject || null}
                  onProcessComplete={() => {
                    loadMeetings()
                    loadRecordingSessions()
                  }}
                />
              )}

              {/* Upcoming Meetings */}
              <div className="mb-8">
                <UpcomingMeetings 
                  meetings={upcomingMeetings}
                  selectedMeetings={selectedMeetings}
                  onSelectMeeting={handleSelectMeeting}
                />
              </div>

              {/* Past Meetings */}
              <div className="mb-8">
          <PastMeetings 
            meetings={pastMeetings}
            selectedMeetings={selectedMeetings}
            onSelectMeeting={handleSelectMeeting}
            onDeleteMeeting={handleDeleteMeeting}
          />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <FloatingActionButtons />
      
      {/* Recording Widget is now global - managed by RecordingProvider */}
    </div>
  )
}
