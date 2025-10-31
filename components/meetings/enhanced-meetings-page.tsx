'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Video, MapPin, Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { dataService } from '@/lib/data-service'
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
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <div className="flex items-center gap-2 text-gray-600">
              {getTypeIcon(meeting.meeting_type)}
              <span className="capitalize">{meeting.meeting_type.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{meeting.date}</p>
                <p className="text-sm text-gray-600">{meeting.start_time} - {meeting.end_time}</p>
              </div>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">{meeting.location}</p>
                </div>
              </div>
            )}
          </div>

          {meeting.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{meeting.description}</p>
            </div>
          )}

          {meeting.attendees.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Attendees</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees.map((attendee, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meeting.agenda.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Agenda</h3>
              <ol className="space-y-2">
                {meeting.agenda.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {meeting.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{meeting.notes}</p>
              </div>
            </div>
          )}

          {meeting.recording_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Recording</h3>
              <a
                href={meeting.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View Recording
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            onClick={() => onDelete(meeting.id)}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={() => onEdit(meeting)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
    loadMeetings()
  }, [])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      
      // Load meetings from Supabase
      const { supabase } = await import('@/lib/supabase')
      
      if (supabase) {
        const { data: meetingsData, error } = await supabase
          .from('meetings')
          .select(`
            *,
            recording_sessions (
              transcription_status,
              transcription_text,
              duration
            )
          `)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('❌ Error loading recordings from Supabase:', error)
          toast.error('Failed to load recordings from database: ' + error.message)
        } else if (meetingsData) {
          console.log(`📹 Loaded ${meetingsData.length} recordings from Supabase`)
          if (meetingsData.length > 0) {
            console.log('First recording:', meetingsData[0])
          }
          
          // Transform Supabase data to match component interface
          const transformedMeetings: Meeting[] = meetingsData.map((m: any) => ({
            id: m.id,
            title: m.title || 'Untitled Meeting',
            description: m.description || m.summary || '',
            date: new Date(m.scheduled_at).toISOString().split('T')[0],
            start_time: new Date(m.scheduled_at).toTimeString().slice(0, 5),
            end_time: new Date(new Date(m.scheduled_at).getTime() + (m.duration || 30) * 60000).toTimeString().slice(0, 5),
            location: m.location,
            meeting_type: 'video_call', // Default for recordings
            status: 'completed', // Recordings are always completed
            attendees: Array.isArray(m.attendees) ? m.attendees : [],
            project_id: m.project_id,
            agenda: Array.isArray(m.action_items) ? m.action_items : [],
            notes: m.recording_sessions?.[0]?.transcription_text || m.summary || '',
            recording_url: m.recording_url,
            created_at: m.created_at,
            updated_at: m.updated_at
          }))
          
          console.log(`✅ Transformed ${transformedMeetings.length} recordings for display`)
          if (transformedMeetings.length > 0) {
            console.log('Sample recording:', transformedMeetings[0])
          }
          setMeetings(transformedMeetings)
          return
        }
      }
      
      // Fallback to empty if Supabase not available
      console.log('Supabase not available, showing empty meetings list')
      setMeetings([])
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
      const { supabase } = await import('@/lib/supabase')
      
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (error) throw error

      setMeetings(prev => prev.filter(m => m.id !== meetingId))
      setShowViewModal(false)
      setSelectedMeeting(null)
      toast.success('Recording deleted successfully')
    } catch (error) {
      console.error('Error deleting recording:', error)
      toast.error('Failed to delete recording')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings found</h3>
              <p className="text-gray-600 mb-4">
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
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewMeeting(meeting)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500">
                        {getTypeIcon(meeting.meeting_type)}
                        <span className="text-xs capitalize">{meeting.meeting_type.replace('_', ' ')}</span>
                      </div>
                      {meeting.notes && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Transcript
                        </span>
                      )}
                    </div>
                    
                    {meeting.description && (
                      <p className="text-gray-600 text-sm mb-3">{meeting.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{meeting.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{meeting.start_time} - {meeting.end_time}</span>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{meeting.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{meeting.attendees.length} attendees</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* View Details button - navigates to meeting detail page */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/meetings/${meeting.id}`)
                      }}
                      className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 flex items-center gap-2 text-sm"
                      title="View transcript and tasks"
                    >
                      <FileText className="h-4 w-4" />
                      Details
                    </button>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteMeeting(meeting.id)
                      }}
                      className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete recording"
                    >
                      <Trash2 className="h-4 w-4" />
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




