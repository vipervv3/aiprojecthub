'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/app-layout'
import { ArrowLeft, Calendar, Clock, FileText, CheckSquare, Loader, AlertCircle, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Meeting {
  id: string
  title: string
  description?: string
  scheduled_at: string
  duration?: number
  summary?: string
  action_items?: string[]
  ai_insights?: any
  created_at: string
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

      // Load meeting
      console.log('📋 Loading meeting:', meetingId)
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

      if (meetingError) throw meetingError
      console.log('✅ Meeting loaded')
      console.log('   Summary:', meetingData.summary ? 'YES' : 'NO')
      console.log('   AI Insights:', meetingData.ai_insights ? 'YES' : 'NO')
      setMeeting(meetingData)

      // Load recording session
      console.log('🎙️ Loading recording session...')
      const { data: recordingData, error: recordingError } = await supabase
        .from('recording_sessions')
        .select('*')
        .eq('metadata->>meetingId', meetingId)
        .maybeSingle()

      if (recordingError) {
        console.log('⚠️ Recording session error:', recordingError.message)
      }

      if (recordingData) {
        console.log('✅ Recording session found')
        console.log('   Status:', recordingData.transcription_status)
        console.log('   Has transcript:', recordingData.transcription_text ? 'YES' : 'NO')
        setRecording(recordingData)
      } else {
        console.log('⚠️ No recording session found')
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
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'todo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    )
  }

  if (!meeting) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Meeting Not Found</h2>
          <p className="text-gray-600 mb-6">The meeting you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/meetings')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Meetings
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/meetings')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meetings
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit Meeting
              </button>
              <button
                onClick={handleDeleteMeeting}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete Meeting'}
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
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
          </div>

          {meeting.description && (
            <p className="text-gray-600 mt-4">{meeting.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'transcript'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Tasks ({tasks.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* AI Summary */}
            {meeting.summary && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Meeting Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">{meeting.summary}</p>
              </div>
            )}

            {/* Key Points */}
            {meeting.ai_insights?.keyPoints && meeting.ai_insights.keyPoints.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h2>
                <ul className="space-y-2">
                  {meeting.ai_insights.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {meeting.action_items && meeting.action_items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Action Items</h2>
                <ul className="space-y-2">
                  {meeting.action_items.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckSquare className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {recording?.transcription_text ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Full Transcript</h2>
                  {recording.transcription_confidence && (
                    <span className="text-sm text-gray-600">
                      Confidence: {Math.round(recording.transcription_confidence * 100)}%
                    </span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {recording.transcription_text}
                  </p>
                </div>
              </>
            ) : recording?.transcription_status === 'processing' ? (
              <div className="text-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Transcription in progress...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No transcript available</p>
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
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        {task.is_ai_generated && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            AI Generated
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{task.description}</p>
                      {task.due_date && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tasks generated from this meeting yet</p>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Meeting</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

