'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, Clock, Users, AlertCircle, CheckCircle, FileText, Mic, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { dataService } from '@/lib/data-service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CalendarSyncManager } from './calendar-sync-manager'

interface CalendarEvent {
  id: string
  title: string
  type: 'project' | 'task' | 'meeting' | 'deadline'
  start: Date
  end?: Date
  allDay?: boolean
  description?: string
  status?: string
  priority?: string
  assignee?: string
  project_id?: string
  color?: string
  // For synced/recurring events
  external_uid?: string
  recurrence?: string
}

interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  isCurrentMonth: boolean
  isToday: boolean
}

const CreateMeetingModal: React.FC<{ 
  onClose: () => void; 
  onSave: (meeting: any) => void;
  initialDate?: Date;
}> = ({ onClose, onSave, initialDate }) => {
  // Calculate initial times based on initialDate
  const getInitialTimes = () => {
    if (initialDate) {
      const hour = initialDate.getHours()
      const minute = initialDate.getMinutes()
      const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      const endHour = hour + 1
      const endTime = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      return { startTime, endTime }
    }
    return { startTime: '09:00', endTime: '10:00' }
  }
  
  const { startTime: initialStartTime, endTime: initialEndTime } = getInitialTimes()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: initialStartTime,
    endTime: initialEndTime,
    location: '',
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
      location: formData.location
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Meeting</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Conference Room A, Zoom link, etc."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 touch-manipulation"
            >
              Create Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EditMeetingModal: React.FC<{ 
  onClose: () => void; 
  onSave: (meeting: any) => void;
  meeting: any;
}> = ({ onClose, onSave, meeting }) => {
  const scheduledDate = new Date(meeting.scheduled_at)
  const endTime = meeting.duration ? new Date(scheduledDate.getTime() + meeting.duration * 60000) : new Date(scheduledDate.getTime() + 60 * 60000)
  
  const [formData, setFormData] = useState({
    title: meeting.title || '',
    description: meeting.description || '',
    date: scheduledDate.toISOString().split('T')[0],
    startTime: scheduledDate.toTimeString().substring(0, 5),
    endTime: endTime.toTimeString().substring(0, 5),
    location: meeting.location || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const scheduledAt = new Date(`${formData.date}T${formData.startTime}`)
    const endTime = new Date(`${formData.date}T${formData.endTime}`)
    const duration = Math.round((endTime.getTime() - scheduledAt.getTime()) / 60000)
    
    onSave({
      ...meeting,
      title: formData.title,
      description: formData.description,
      scheduled_at: scheduledAt.toISOString(),
      duration,
      location: formData.location,
    })
    onClose()
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Conference Room A, Zoom link, etc."
            />
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

const EventModal: React.FC<{ event: CalendarEvent; onClose: () => void; onDelete?: (id: string) => void; onEdit?: (event: CalendarEvent) => void }> = ({ event, onClose, onDelete, onEdit }) => {
  const router = useRouter()
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-800'
      case 'task': return 'bg-green-100 text-green-800'
      case 'meeting': return 'bg-purple-100 text-purple-800'
      case 'deadline': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const handleViewDetails = () => {
    const realId = event.id.replace(/^(task-|meeting-|project-|project-deadline-)/, '')
    
    if (event.type === 'meeting') {
      router.push(`/meetings/${realId}`)
    } else if (event.type === 'task') {
      router.push(`/tasks`)
    } else if (event.type === 'project' || event.type === 'deadline') {
      router.push(`/projects/${event.project_id || realId}`)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{event.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
              {event.type}
            </span>
            {event.priority && (
              <span className={`text-sm font-medium ${getPriorityColor(event.priority)}`}>
                {event.priority} priority
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>{event.start.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>

          {!event.allDay && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>
                {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {event.end && ` - ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>
          )}

          {event.assignee && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{event.assignee}</span>
            </div>
          )}

          {event.description && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{event.description}</p>
            </div>
          )}

          {event.status && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'completed' ? 'bg-green-100 text-green-800' :
                event.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.status.replace('_', ' ')}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              {/* Only show Edit/Delete for manually created meetings, not synced external calendar events */}
              {event.type === 'meeting' && !event.id.startsWith('synced-') && onEdit && (
                <button
                  onClick={() => {
                    onEdit(event)
                    onClose()
                  }}
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 touch-manipulation"
                >
                  <FileText className="h-4 w-4" />
                  Edit
                </button>
              )}
              {event.type === 'meeting' && !event.id.startsWith('synced-') && onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this meeting?')) {
                      onDelete(event.id)
                      onClose()
                    }
                  }}
                  className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
              >
                Close
              </button>
              <button
                onClick={handleViewDetails}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2 touch-manipulation"
              >
                <FileText className="h-4 w-4" />
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedCalendarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'day' | 'mobile3day'>('week')
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile and set view accordingly
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile && view === 'week') {
        setView('mobile3day')
      } else if (!mobile && view === 'mobile3day') {
        setView('week')
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [view])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [showSyncManager, setShowSyncManager] = useState(false)
  const [autoSyncing, setAutoSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  // Auto-sync external calendars every 10 minutes
  useEffect(() => {
    const AUTO_SYNC_INTERVAL = 10 * 60 * 1000 // 10 minutes in milliseconds

    const autoSyncCalendars = async () => {
      // Skip if not authenticated
      if (!user?.id || !supabase) return

      try {
        setAutoSyncing(true)
        console.log('🔄 Auto-syncing external calendars...')

        // Get all enabled syncs
        const { data: syncs, error } = await supabase
          .from('calendar_syncs')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('enabled', true)

        if (error || !syncs || syncs.length === 0) {
          console.log('No enabled calendar syncs found')
          return
        }

        // Refresh each sync
        for (const sync of syncs) {
          try {
            const response = await fetch('/api/calendar-sync', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ syncId: sync.id, action: 'refresh' })
            })

            if (response.ok) {
              console.log(`✅ Auto-synced: ${sync.name}`)
            }
          } catch (error) {
            console.error(`Error auto-syncing ${sync.name}:`, error)
          }
        }

        // Reload calendar events
        await loadEvents()
        setLastSyncTime(new Date())
        
        toast.success('Calendars synced', {
          duration: 2000,
          description: `Updated ${syncs.length} calendar(s)`
        })
      } catch (error) {
        console.error('Auto-sync error:', error)
      } finally {
        setAutoSyncing(false)
      }
    }

    // Run initial sync after 30 seconds (give user time to see the page)
    const initialTimeout = setTimeout(autoSyncCalendars, 30000)

    // Then run every 10 minutes
    const intervalId = setInterval(autoSyncCalendars, AUTO_SYNC_INTERVAL)

    // Pause sync when tab is hidden (save battery/bandwidth)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('⏸️  Auto-sync paused (tab hidden)')
        clearInterval(intervalId)
      } else {
        console.log('▶️  Auto-sync resumed (tab visible)')
        // Restart interval when tab becomes visible again
        const newIntervalId = setInterval(autoSyncCalendars, AUTO_SYNC_INTERVAL)
        return () => clearInterval(newIntervalId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on unmount
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id])  // Re-run if user changes

  const loadEvents = async () => {
    try {
      setLoading(true)
      
      // Load projects and tasks
      const projects = await dataService.getProjects(user?.id || '')
      const tasks = await dataService.getTasks(user?.id || '')
      
      const calendarEvents: CalendarEvent[] = []
      
      // Add project events
      projects.forEach((project: any) => {
        if ((project as any).start_date) {
          calendarEvents.push({
            id: `project-${project.id}`,
            title: project.name,
            type: 'project',
            start: new Date((project as any).start_date),
            allDay: true,
            description: project.description,
            status: project.status,
            color: 'blue',
            project_id: project.id
          })
        }
        
        if (project.due_date) {
          calendarEvents.push({
            id: `project-deadline-${project.id}`,
            title: `${project.name} - Deadline`,
            type: 'deadline',
            start: new Date(project.due_date),
            allDay: true,
            description: `Project deadline for ${project.name}`,
            status: new Date(project.due_date) < new Date() ? 'overdue' : 'pending',
            color: 'red',
            project_id: project.id
          })
        }
      })
      
      // Add task events (due dates)
      tasks.forEach(task => {
        if (task.due_date) {
          const dueDate = new Date(task.due_date)
          const isOverdue = dueDate < new Date() && task.status !== 'completed'
          
          calendarEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            type: 'task',
            start: dueDate,
            allDay: true,
            description: task.description,
            status: isOverdue ? 'overdue' : task.status,
            priority: task.priority,
            assignee: task.assignee_id,
            color: isOverdue ? 'red' : 'green',
            project_id: task.project_id
          })
        }
      })
      
      // Load real meetings from Supabase (exclude recording meetings)
      if (supabase && user?.id) {
        // ✅ SIMPLIFIED APPROACH: Only load manually created meetings
        // Meetings with a recording_session_id are from recordings and should NOT appear on calendar
        // Note: meetings table doesn't have user_id, so we filter via recording_session_id = null
        const { data: meetingsData, error } = await supabase
          .from('meetings')
          .select('*')
          .is('recording_session_id', null)  // ✅ Only get meetings NOT linked to recordings
          .order('scheduled_at', { ascending: false })
        
        if (!error && meetingsData) {
          console.log(`📅 Loaded ${meetingsData.length} manually scheduled meetings for calendar (recordings excluded)`)
          
          meetingsData.forEach((meeting: any) => {
            const meetingDate = new Date(meeting.scheduled_at)
            const duration = meeting.duration || 30
            const endDate = new Date(meetingDate.getTime() + duration * 60000)
            
            calendarEvents.push({
              id: `meeting-${meeting.id}`,
              title: meeting.title || 'Untitled Meeting',
              type: 'meeting',
              start: meetingDate,
              end: endDate,
              description: meeting.description || 'No description',
              status: meeting.status || 'scheduled',
              color: 'purple',
              allDay: false
            })
          })
        } else if (error) {
          console.warn('Error loading meetings for calendar:', error)
        }
      }
      
      // Load synced events from external calendars
      if (supabase) {
        // Expand date range to show more events (6 months total: 3 months back, 3 months forward)
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1)
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 4, 0)
        
        const { data: syncedEventsData, error: syncedError } = await supabase
          .from('synced_events')
          .select(`
            *,
            sync:calendar_syncs!inner(
              name,
              color,
              enabled
            )
          `)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString())
          .order('start_time', { ascending: true })

        if (!syncedError && syncedEventsData) {
          console.log(`📅 Loaded ${syncedEventsData.length} synced events from external calendars`)
          let addedCount = 0
          let skippedDisabled = 0
          
          // Track events by unique key to prevent true duplicates (same external_uid + same start_time)
          // Note: Recurring events have same external_uid but different start_time, so all instances will show
          const seenEventKeys = new Set<string>()
          
          syncedEventsData.forEach((syncedEvent: any) => {
            // Only include if the sync is enabled
            if (!syncedEvent.sync?.enabled) {
              skippedDisabled++
              return
            }
            
            // Create unique key: external_uid + start_time
            // This ensures recurring events (same external_uid, different start_time) all show
            // But prevents duplicates if somehow the same event is loaded twice
              const eventKey = `${syncedEvent.external_uid}-${syncedEvent.start_time}`
              
            if (!seenEventKeys.has(eventKey)) {
              seenEventKeys.add(eventKey)
              
              // Properly handle timezone for synced events
              // Events are stored in UTC (ISO format), JavaScript Date constructor handles this correctly
              // But we need to ensure the date is created properly to avoid timezone shifts
              let startDate: Date
              let endDate: Date | undefined
              
              try {
                // Parse the ISO string directly - JavaScript Date handles UTC correctly
                startDate = new Date(syncedEvent.start_time)
                
                // Validate the date is valid
                if (isNaN(startDate.getTime())) {
                  console.warn(`⚠️ Invalid start_time for event: ${syncedEvent.title}`, syncedEvent.start_time)
                  return // Skip invalid events
                }
                
                if (syncedEvent.end_time) {
                  endDate = new Date(syncedEvent.end_time)
                  if (isNaN(endDate.getTime())) {
                    console.warn(`⚠️ Invalid end_time for event: ${syncedEvent.title}`, syncedEvent.end_time)
                    endDate = undefined
                  }
                }
                
              // 🔍 DEBUG: Log synced events to verify times and identify duplicates
              const dayName = startDate.toLocaleDateString('en-US', { weekday: 'short' })
              console.log(`🔄 Synced event "${syncedEvent.title}" on ${dayName} ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (external_uid: ${syncedEvent.external_uid.substring(0, 20)}...)`)
              
              } catch (dateError) {
                console.error(`❌ Error parsing dates for event: ${syncedEvent.title}`, dateError)
                return // Skip events with date parsing errors
              }
                
                calendarEvents.push({
                  id: `synced-${syncedEvent.id}`,
                  title: syncedEvent.title,
                  type: 'meeting',
                start: startDate,
                end: endDate,
                  description: syncedEvent.description || '',
                  status: 'scheduled',
                  color: syncedEvent.sync?.color || 'purple',
                allDay: syncedEvent.all_day || false,
                // Store external_uid for recurring event detection
                external_uid: syncedEvent.external_uid,
                recurrence: syncedEvent.recurrence
                })
                addedCount++
              } else {
                console.log(`🔄 Skipped duplicate synced event: ${syncedEvent.title} at ${syncedEvent.start_time}`)
            }
          })
          
          console.log(`✅ Added ${addedCount} unique enabled synced events to calendar`)
          if (skippedDisabled > 0) {
            console.log(`ℹ️  Skipped ${skippedDisabled} events from disabled syncs`)
          }
          
          // Log recurring events info
          const recurringCount = syncedEventsData.filter((e: any) => e.recurrence).length
          if (recurringCount > 0) {
            console.log(`🔄 Found ${recurringCount} recurring event instances (all shown)`)
          }
        } else if (syncedError) {
          console.warn('Error loading synced events:', syncedError)
        }
      }

      // Enhanced deduplication: Remove true duplicates but preserve recurring events
      // IMPORTANT: Recurring events have same external_uid but different start_time
      // We only remove duplicates with EXACT same ID or same title + same exact start time
      const uniqueEvents = calendarEvents.filter((event, index, self) => {
        return index === self.findIndex((e) => {
          // Check if it's the exact same event (same ID) - always keep first occurrence
          if (e.id === event.id) return true
          
          // For synced events with external_uid, use that + start_time as unique key
          // This ensures recurring events (same external_uid, different start_time) are preserved
          if (event.external_uid && e.external_uid) {
            const sameExternalUid = e.external_uid === event.external_uid
            const sameStartTime = e.start.getTime() === event.start.getTime()
            // If same external_uid and same start_time, it's a duplicate
            if (sameExternalUid && sameStartTime) return true
            // If same external_uid but different start_time, they're both recurring instances - keep both
            if (sameExternalUid && !sameStartTime) return false
          }
          
          // For other events, check for duplicates with same title + exact same start time + same type
          // This handles cases like manually created meeting matching a synced event
          const sameTitle = e.title === event.title
          const sameStartTime = e.start.getTime() === event.start.getTime()
          const sameType = e.type === event.type
          
          // Only consider it a duplicate if ALL three match exactly
          // This preserves recurring events which have different start times
          return sameTitle && sameStartTime && sameType
        })
      })

      const duplicateCount = calendarEvents.length - uniqueEvents.length
      console.log(`📅 Total calendar events: ${calendarEvents.length} (${uniqueEvents.length} unique)`)
      if (duplicateCount > 0) {
        console.warn(`⚠️ Removed ${duplicateCount} duplicate events`)
        console.log('📋 Duplicate details:', {
          total: calendarEvents.length,
          unique: uniqueEvents.length,
          removed: duplicateCount
        })
      }
      
      // Log event distribution by type
      const eventsByType = uniqueEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      console.log('📊 Events by type:', eventsByType)
      
      // Log events for the CURRENT WEEK to debug multi-day display issue
      const today = new Date()
      const startOfWeek = new Date(today)
      const dayOfWeek = startOfWeek.getDay()
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      
      const thisWeekEvents = uniqueEvents
        .filter(e => {
          const eventDate = new Date(e.start)
          return eventDate >= startOfWeek && eventDate < endOfWeek && e.id.startsWith('synced-')
        })
        .slice(0, 10)
        .map(e => {
          const startDay = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate())
          const endDay = e.end ? new Date(e.end.getFullYear(), e.end.getMonth(), e.end.getDate()) : null
          const isSameDay = endDay ? startDay.getTime() === endDay.getTime() : true
          const durationHours = e.end ? Math.round((e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60) * 100) / 100 : null
          
          return {
            id: e.id.substring(0, 20) + '...',
            title: e.title.substring(0, 40),
            start: e.start.toISOString(),
            end: e.end?.toISOString(),
            allDay: e.allDay,
            startDay: startDay.toDateString(),
            endDay: endDay?.toDateString(),
            isSameDay,
            durationHours
          }
        })
      console.log(`🔍 DEBUG - Events for current week (${startOfWeek.toDateString()} to ${endOfWeek.toDateString()}):`, thisWeekEvents)
      
      setEvents(uniqueEvents)
    } catch (error) {
      console.error('Error loading calendar events:', error)
      toast.error('Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMeeting = async (meetingData: any) => {
    try {
      if (!supabase || !user) {
        toast.error('Unable to create meeting')
        return
      }

      // Remove fields not in database schema (location, status, user_id, meeting_type, meeting_source)
      const { location, status, meeting_type, meeting_source, ...cleanMeetingData } = meetingData

      console.log('📅 Creating meeting:', cleanMeetingData)

      const { data, error } = await supabase
        .from('meetings')
        .insert([cleanMeetingData])
        .select()

      if (error) {
        console.error('❌ Error creating meeting:', error)
        toast.error('Failed to create meeting: ' + error.message)
        return
      }

      console.log('✅ Meeting created successfully:', data)
      toast.success('Meeting created successfully')
      setShowCreateModal(false)
      await loadEvents() // Reload events
    } catch (error) {
      console.error('Error creating meeting:', error)
      toast.error('Failed to create meeting')
    }
  }

  const handleDeleteMeeting = async (eventId: string) => {
    try {
      // Extract the real meeting ID
      const meetingId = eventId.replace('meeting-', '')

      console.log('🗑️ Deleting meeting:', meetingId)

      // ✅ Get auth token for API request
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call API route to delete with authentication
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ Error deleting meeting:', error)
        toast.error('Failed to delete meeting: ' + (error.error || 'Unknown error'))
        return
      }

      console.log('✅ Meeting deleted successfully')
      toast.success('Meeting deleted successfully')
      setSelectedEvent(null) // Close the modal
      await loadEvents() // Reload events
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast.error('Failed to delete meeting')
    }
  }

  const handleEditMeeting = async (event: CalendarEvent) => {
    try {
      if (!supabase) {
        toast.error('Unable to edit meeting')
        return
      }

      // Extract the real meeting ID
      const meetingId = event.id.replace('meeting-', '').replace('synced-', '')

      // Fetch the full meeting data
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

      if (error || !data) {
        console.error('Error fetching meeting:', error)
        toast.error('Failed to load meeting details')
        return
      }

      setEditingMeeting(data)
    } catch (error) {
      console.error('Error loading meeting for edit:', error)
      toast.error('Failed to load meeting details')
    }
  }

  const handleUpdateMeeting = async (meetingData: any) => {
    try {
      if (!supabase) {
        toast.error('Unable to update meeting')
        return
      }

      // Remove fields not in database schema (location, status, meeting_type, meeting_source)
      const { location, status, meeting_type, meeting_source, ...cleanMeetingData } = meetingData

      const { error } = await supabase
        .from('meetings')
        .update(cleanMeetingData)
        .eq('id', meetingData.id)

      if (error) {
        console.error('Error updating meeting:', error)
        toast.error('Failed to update meeting')
        return
      }

      toast.success('Meeting updated successfully')
      setEditingMeeting(null)
      await loadEvents() // Reload events
    } catch (error) {
      console.error('Error updating meeting:', error)
      toast.error('Failed to update meeting')
    }
  }

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: CalendarDay[] = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const dayEvents = getEventsForDate(currentDate)
      days.push({
        date: new Date(currentDate),
        events: dayEvents,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: isSameDay(currentDate, new Date())
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      // Normalize dates to midnight for day-level comparison
      const eventStartDay = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate())
      const checkDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      // All-day events
      if (event.allDay) {
        return eventStartDay.getTime() === checkDay.getTime()
      }
      
      // For timed events
      if (event.end) {
        const eventEndDay = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate())
        const durationHours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)
        
        // If event starts and ends on the same day, only show on that day
        if (eventStartDay.getTime() === eventEndDay.getTime()) {
          return checkDay.getTime() === eventStartDay.getTime()
        }
        
        // FIX: If duration is less than 24 hours, it's a single-day meeting (not multi-day)
        // Only show it on its START day (this fixes Outlook sync issues with timezone/end times)
        if (durationHours < 24) {
          return checkDay.getTime() === eventStartDay.getTime()
        }
        
        // For truly multi-day events (24+ hours like conferences/vacations), show on all days
        return checkDay.getTime() >= eventStartDay.getTime() && checkDay.getTime() <= eventEndDay.getTime()
      }
      
      // Events without end time only show on their start day
      return eventStartDay.getTime() === checkDay.getTime()
    })
  }

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventColor = (color?: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'purple': return 'bg-purple-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredEvents = typeFilter === 'all' ? events : events.filter(event => event.type === typeFilter)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View your projects, tasks, and meetings</p>
              {autoSyncing && (
                <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Syncing...
                </span>
              )}
              {lastSyncTime && !autoSyncing && (
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  • Last synced: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3 flex-wrap">
            {/* View Selector */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 text-sm font-medium touch-manipulation ${
                  view === 'month' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 touch-manipulation ${
                  view === 'week' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Week
              </button>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All Events</option>
              <option value="project">Projects</option>
              <option value="task">Tasks</option>
              <option value="meeting">Meetings</option>
              <option value="deadline">Deadlines</option>
            </select>
            <button 
              onClick={() => {
                loadEvents()
                toast.success('Calendar refreshed')
              }}
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 touch-manipulation"
            >
              <Calendar className="h-5 w-5" />
              Refresh
            </button>
            <button
              onClick={() => setShowSyncManager(true)}
              className="bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors touch-manipulation"
            >
              <RefreshCw className="h-5 w-5" />
              Sync
            </button>
            <button
              onClick={() => {
                setSelectedDate(undefined)
                setShowCreateModal(true)
              }}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation"
            >
              <Plus className="h-5 w-5" />
              Add Meeting
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedDate(undefined)
                setShowCreateModal(true)
              }}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation text-sm font-medium flex-1 sm:flex-none justify-center"
            >
              <Plus className="h-4 w-4" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Meeting</span>
            </button>
            <button
              onClick={() => setShowSyncManager(true)}
              className="bg-purple-600 dark:bg-purple-500 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors touch-manipulation"
              title="Sync Calendars"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button 
              onClick={() => {
                loadEvents()
                toast.success('Calendar refreshed')
              }}
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
              title="Refresh"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legend - Hidden on mobile */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Types:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Meetings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Deadlines</span>
            </div>
          </div>
        </div>

        {/* Mobile 3-Day View - Shows only 3 days on mobile */}
        {(view === 'mobile3day' || (isMobile && view === 'week')) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Mobile Navigation */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setDate(currentDate.getDate() - 3)
                    setCurrentDate(newDate)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setDate(currentDate.getDate() + 3)
                    setCurrentDate(newDate)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </h2>
            </div>

            {/* 3-Day Grid */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-3 min-w-full">
                {(() => {
                  // Get today, tomorrow, and day after tomorrow
                  const today = new Date(currentDate)
                  today.setHours(0, 0, 0, 0)
                  
                  return Array.from({ length: 3 }).map((_, dayIndex) => {
                    const dayDate = new Date(today)
                    dayDate.setDate(today.getDate() + dayIndex)
                    const isToday = dayDate.toDateString() === new Date().toDateString()
                    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' })
                    const dayNum = dayDate.getDate()
                    const monthName = dayDate.toLocaleDateString('en-US', { month: 'short' })
                    
                    // Get events for this day
                    const dayEvents = filteredEvents.filter(event => {
                      if (event.allDay) {
                        const eventDay = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate())
                        return eventDay.toDateString() === dayDate.toDateString()
                      }
                      const eventDay = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate())
                      return eventDay.toDateString() === dayDate.toDateString()
                    })
                    
                    return (
                      <div 
                        key={dayIndex}
                        className={`border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}
                      >
                        {/* Day Header */}
                        <div className={`p-3 text-center border-b border-gray-200 dark:border-gray-700 ${isToday ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{dayName}</div>
                          <div className={`text-lg sm:text-xl font-bold mt-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {dayNum}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{monthName}</div>
                        </div>
                        
                        {/* Events List */}
                        <div className="p-2 space-y-2 min-h-[400px] max-h-[600px] overflow-y-auto">
                          {dayEvents.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                              No events
                            </div>
                          ) : (
                            dayEvents
                              .sort((a, b) => {
                                if (a.allDay && !b.allDay) return -1
                                if (!a.allDay && b.allDay) return 1
                                return a.start.getTime() - b.start.getTime()
                              })
                              .map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={`w-full text-left p-2 rounded-lg border border-gray-200 dark:border-gray-700 ${getEventColor(event.color)} text-white text-xs hover:opacity-90 transition-opacity touch-manipulation`}
                                >
                                  {event.allDay ? (
                                    <div className="font-semibold truncate">{event.title}</div>
                                  ) : (
                                    <>
                                      <div className="font-medium">{event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                                      <div className="font-semibold truncate mt-0.5">{event.title}</div>
                                    </>
                                  )}
                                  {event.description && (
                                    <div className="truncate mt-1 opacity-90 text-xs">{event.description}</div>
                                  )}
                                </button>
                              ))
                          )}
                          
                          {/* Add event button */}
                          <button
                            onClick={() => {
                              setSelectedDate(dayDate)
                              setShowCreateModal(true)
                            }}
                            className="w-full p-2 text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation flex items-center justify-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add event
                          </button>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Week View with Time Slots - Desktop only */}
        {view === 'week' && !isMobile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Week Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setDate(currentDate.getDate() - 7)
                    setCurrentDate(newDate)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const newDate = new Date(currentDate)
                    newDate.setDate(currentDate.getDate() + 7)
                    setCurrentDate(newDate)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
            </div>

            {/* Week Grid */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Day Headers */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700">
                  <div className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"></div>
                  {(() => {
                    // ✅ FIX: Use date manipulation that preserves timezone
                    const now = new Date(currentDate)
                    now.setHours(0, 0, 0, 0) // Reset to midnight
                    const dayOfWeek = now.getDay()
                    
                    // Calculate start of week by subtracting days
                    const startOfWeek = new Date(now)
                    startOfWeek.setDate(now.getDate() - dayOfWeek)
                    
                    return Array.from({ length: 7 }).map((_, dayIndex) => {
                      // Create each day by adding days to start of week
                      const columnDate = new Date(startOfWeek)
                      columnDate.setDate(startOfWeek.getDate() + dayIndex)
                      
                      const isToday = columnDate.toDateString() === new Date().toDateString()
                      const dayName = columnDate.toLocaleDateString('en-US', { weekday: 'short' })
                      
                      return (
                        <div key={dayIndex} className={`p-3 text-center border-l border-gray-200 dark:border-gray-700 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{dayName}</div>
                          <div className={`text-lg font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {columnDate.getDate()}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>

                {/* Time Slots */}
                <div className="relative">
                  {Array.from({ length: 17 }, (_, i) => i + 6).map(hour => {
                    const timeLabel = `${hour > 12 ? hour - 12 : hour === 12 ? 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`
                    
                    return (
                      <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 min-h-[60px]">
                        <div className="p-2 text-right text-sm text-gray-500 dark:text-gray-400 font-medium border-r border-gray-200 dark:border-gray-700">
                          {timeLabel}
                        </div>
                        {(() => {
                          // ✅ FIX: Use date manipulation that preserves timezone
                          const now = new Date(currentDate)
                          now.setHours(0, 0, 0, 0) // Reset to midnight
                          const dayOfWeek = now.getDay()
                          
                          // Calculate start of week by subtracting days
                          const startOfWeek = new Date(now)
                          startOfWeek.setDate(now.getDate() - dayOfWeek)
                          
                          return Array.from({ length: 7 }).map((_, dayIndex) => {
                            // Create each day by adding days to start of week
                            const columnDate = new Date(startOfWeek)
                            columnDate.setDate(startOfWeek.getDate() + dayIndex)
                            const isToday = columnDate.toDateString() === new Date().toDateString()
                            
                            // ✅ SPAN FULL DURATION: Get events for this day that START or SPAN this hour
                            const dayEvents = filteredEvents.filter(event => {
                              if (event.allDay) return false
                              
                              // Ensure we have a valid Date object
                              const eventDate = new Date(event.start)
                              if (isNaN(eventDate.getTime())) {
                                console.warn(`⚠️ Invalid event date:`, event)
                                return false
                              }
                              
                              // Get the hour in local time
                              const eventStartHour = eventDate.getHours()
                              const eventStartMinute = eventDate.getMinutes()
                              
                              // Calculate event end hour
                              const eventEnd = event.end ? new Date(event.end) : new Date(eventDate.getTime() + 60 * 60 * 1000) // Default 1 hour
                              const eventEndHour = eventEnd.getHours()
                              const eventEndMinute = eventEnd.getMinutes()
                              
                              // Compare dates as strings (year-month-day)
                              const eventDay = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`
                              const columnDay = `${columnDate.getFullYear()}-${String(columnDate.getMonth() + 1).padStart(2, '0')}-${String(columnDate.getDate()).padStart(2, '0')}`
                              
                              // Only show on correct day
                              if (eventDay !== columnDay) return false
                              
                              // Show event if this hour slot is within the event's duration
                              // Event starts at 9:30 AM, ends at 11:15 AM → show in hours 9, 10, and 11
                              const isInEventDuration = (hour >= eventStartHour && hour < eventEndHour) || 
                                                       (hour === eventEndHour && eventEndMinute > 0)
                              
                              // Only render event in its START hour (to avoid duplicates)
                              return eventStartHour === hour && isInEventDuration
                            })
                            
                            return (
                              <div 
                                key={dayIndex} 
                                className={`p-1 border-l border-gray-200 dark:border-gray-700 relative overflow-visible cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}`}
                                onClick={() => {
                                  // Create date with the selected hour
                                  const meetingDate = new Date(columnDate)
                                  meetingDate.setHours(hour, 0, 0, 0)
                                  setSelectedDate(meetingDate)
                                  setShowCreateModal(true)
                                }}
                              >
                                {dayEvents.map(event => {
                                  // Calculate how many hour slots this event spans
                                  const eventStart = new Date(event.start)
                                  const eventEnd = event.end ? new Date(event.end) : new Date(eventStart.getTime() + 60 * 60 * 1000)
                                  const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (60 * 1000)
                                  const hourSlots = Math.ceil(durationMinutes / 60)
                                  
                                  // Calculate height: each hour slot is ~60px (min-h-[60px])
                                  const height = hourSlots * 60 - 8 // Subtract 8px for padding/margins
                                  
                                  return (
                                    <div
                                      key={event.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedEvent(event)
                                      }}
                                      style={{ height: `${height}px`, minHeight: '52px' }}
                                      className={`${getEventColor(event.color)} text-white text-xs p-1.5 rounded mb-1 cursor-pointer hover:opacity-80 max-w-full absolute left-1 right-1 z-10 shadow-sm`}
                                      title={`${event.title} - ${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${eventEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    >
                                      <div className="font-semibold truncate">{event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                                      <div className="truncate font-medium">{event.title}</div>
                                      {height > 60 && event.description && (
                                        <div className="truncate text-[10px] opacity-90 mt-0.5">{event.description.substring(0, 50)}</div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Month View - Hidden on mobile */}
        {view === 'month' && !isMobile && (
          <>
        {/* Calendar Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg touch-manipulation"
              >
                Today
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 p-2 min-h-[120px] ${
                  !day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'
                } ${day.isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    setSelectedDate(day.date)
                    setShowCreateModal(true)
                  }
                }}
              >
                <div className={`text-sm font-medium mb-1 ${
                  day.isToday ? 'text-blue-600 dark:text-blue-400' : ''
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {day.events.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEvent(event)
                      }}
                      className={`${getEventColor(event.color)} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80`}
                      title={`${event.title} - ${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <div className="truncate">
                        {!event.allDay && (
                          <span className="font-semibold">{event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} </span>
                        )}
                        {event.title}
                      </div>
                    </div>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-6 sm:mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents
              .filter(event => event.start >= new Date())
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .slice(0, 6)
              .map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getEventColor(event.color)}`}></div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{event.start.toLocaleDateString()}</span>
                  </div>
                  {!event.allDay && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
          </>
        )}

        {/* Event Modal */}
        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={handleDeleteMeeting}
            onEdit={handleEditMeeting}
          />
        )}

        {/* Create Meeting Modal */}
        {showCreateModal && (
          <CreateMeetingModal
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateMeeting}
            initialDate={selectedDate}
          />
        )}

        {/* Edit Meeting Modal */}
        {editingMeeting && (
          <EditMeetingModal
            meeting={editingMeeting}
            onClose={() => setEditingMeeting(null)}
            onSave={handleUpdateMeeting}
          />
        )}

        {/* Calendar Sync Manager */}
        {showSyncManager && (
          <CalendarSyncManager
            onClose={() => setShowSyncManager(false)}
            onSync={() => loadEvents()}
          />
        )}
      </div>
    </div>
  )
}





