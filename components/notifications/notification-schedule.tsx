'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface NotificationSchedule {
  id: string
  schedule_type: string
  time_slot: string
  days_of_week: number[]
  is_active: boolean
  ai_intelligence_enabled: boolean
  created_at: string
}

interface NotificationScheduleProps {
  userId: string
}

export default function NotificationSchedule({ userId }: NotificationScheduleProps) {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (userId) {
      loadSchedules()
    }
  }, [userId])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to load schedules
      // For now, using mock data
      const mockSchedules: NotificationSchedule[] = [
        {
          id: '1',
          schedule_type: 'daily',
          time_slot: '08:00',
          days_of_week: [1, 2, 3, 4, 5],
          is_active: true,
          ai_intelligence_enabled: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          schedule_type: 'weekly',
          time_slot: '09:00',
          days_of_week: [1],
          is_active: true,
          ai_intelligence_enabled: true,
          created_at: new Date().toISOString()
        }
      ]
      setSchedules(mockSchedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
      toast.error('Failed to load notification schedules')
    } finally {
      setLoading(false)
    }
  }

  const toggleSchedule = async (scheduleId: string) => {
    try {
      // TODO: Implement API call to toggle schedule
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === scheduleId 
            ? { ...schedule, is_active: !schedule.is_active }
            : schedule
        )
      )
      toast.success('Schedule updated successfully')
    } catch (error) {
      console.error('Error toggling schedule:', error)
      toast.error('Failed to update schedule')
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    try {
      // TODO: Implement API call to delete schedule
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId))
      toast.success('Schedule deleted successfully')
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete schedule')
    }
  }

  const getDaysText = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    if (days.length === 7) return 'Every day'
    if (days.length === 5 && days.includes(1) && days.includes(2) && days.includes(3) && days.includes(4) && days.includes(5)) {
      return 'Weekdays'
    }
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return 'Weekends'
    }
    return days.map(day => dayNames[day]).join(', ')
  }

  const getScheduleTypeText = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'custom':
        return 'Custom'
      default:
        return type
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="card-title">Notification Schedules</h3>
            <p className="card-description">
              Manage your recurring notification schedules
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </button>
        </div>
      </div>
      
      <div className="card-content">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No notification schedules configured</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Your First Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {schedule.time_slot}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{getScheduleTypeText(schedule.schedule_type)}</span>
                      {schedule.schedule_type !== 'daily' && (
                        <span className="ml-1">• {getDaysText(schedule.days_of_week)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </span>
                      
                      {schedule.ai_intelligence_enabled && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          AI Enabled
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleSchedule(schedule.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {schedule.is_active ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  Created {new Date(schedule.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <CreateScheduleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={(schedule) => {
            setSchedules(prev => [schedule, ...prev])
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}

// Create Schedule Modal Component
function CreateScheduleModal({ 
  isOpen, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean
  onClose: () => void
  onSave: (schedule: NotificationSchedule) => void
}) {
  const [formData, setFormData] = useState({
    schedule_type: 'daily',
    time_slot: '08:00',
    days_of_week: [1, 2, 3, 4, 5],
    ai_intelligence_enabled: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newSchedule: NotificationSchedule = {
      id: Date.now().toString(),
      ...formData,
      is_active: true,
      created_at: new Date().toISOString()
    }
    
    onSave(newSchedule)
  }

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Notification Schedule</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Schedule Type</label>
                  <select
                    value={formData.schedule_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, schedule_type: e.target.value }))}
                    className="input mt-1"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Time</label>
                  <input
                    type="time"
                    value={formData.time_slot}
                    onChange={(e) => setFormData(prev => ({ ...prev, time_slot: e.target.value }))}
                    className="input mt-1"
                  />
                </div>
                
                {(formData.schedule_type === 'weekly' || formData.schedule_type === 'custom') && (
                  <div>
                    <label className="label">Days of Week</label>
                    <div className="mt-2 grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleDay(index)}
                          className={`p-2 text-xs rounded-lg border ${
                            formData.days_of_week.includes(index)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ai_enabled"
                    checked={formData.ai_intelligence_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, ai_intelligence_enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="ai_enabled" className="ml-2 text-sm text-gray-700">
                    Enable AI Intelligence
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
