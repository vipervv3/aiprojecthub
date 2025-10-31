'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Sidebar from '@/components/layout/sidebar'
import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import MeetingsHeader from './meetings-header'
import UpcomingMeetings from './upcoming-meetings'
import PastMeetings from './past-meetings'
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

  useEffect(() => {
    if (user) {
      loadMeetings()
      loadRecordingSessions()
    }
  }, [user])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      
      // Load meetings with recording session data
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          recording_sessions(*)
        `)
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
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (error) throw error

      toast.success('Recording deleted successfully')
      loadMeetings()
      loadRecordingSessions()
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error('Failed to delete recording')
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
      const { error } = await supabase
        .from('meetings')
        .delete()
        .in('id', selectedMeetings)

      if (error) throw error

      toast.success(`${selectedMeetings.length} recording(s) deleted successfully`)
      setSelectedMeetings([])
      loadMeetings()
      loadRecordingSessions()
    } catch (error) {
      console.error('Error deleting meetings:', error)
      toast.error('Failed to delete recordings')
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
