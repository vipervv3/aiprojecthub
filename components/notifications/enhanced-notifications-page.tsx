'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bell, Settings, Check, X, Eye, EyeOff, Mail, Smartphone, 
  Clock, Filter, Search, Archive, Trash2, Star, AlertTriangle,
  CheckCircle, Info, User, Calendar, Target, MessageSquare
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'project' | 'task' | 'meeting' | 'system' | 'team'
  read: boolean
  starred: boolean
  created_at: string
  action_url?: string
  metadata?: {
    project_id?: string
    task_id?: string
    user_id?: string
  }
}

interface NotificationTemplate {
  id: string
  name: string
  message: string
  category: string
  enabled: boolean
}

interface NotificationPreferences {
  email: {
    project_updates: boolean
    task_assignments: boolean
    deadline_reminders: boolean
    meeting_invites: boolean
    system_alerts: boolean
  }
  push: {
    project_updates: boolean
    task_assignments: boolean
    deadline_reminders: boolean
    meeting_invites: boolean
    system_alerts: boolean
  }
  frequency: 'immediate' | 'daily' | 'weekly'
  quiet_hours: {
    enabled: boolean
    start: string
    end: string
  }
}

const NotificationCard: React.FC<{
  notification: Notification
  onMarkAsRead: (id: string) => void
  onStar: (id: string) => void
  onDelete: (id: string) => void
}> = ({ notification, onMarkAsRead, onStar, onDelete }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'error': return 'border-red-200 bg-red-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <X className="h-4 w-4 text-red-600" />
      default: return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project': return <Target className="h-4 w-4" />
      case 'task': return <CheckCircle className="h-4 w-4" />
      case 'meeting': return <Calendar className="h-4 w-4" />
      case 'team': return <User className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      notification.read ? 'bg-gray-50 opacity-75' : 'bg-white shadow-sm'
    } ${getTypeColor(notification.type)} hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            )}
          </div>
          
          <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
            {notification.message}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              {getCategoryIcon(notification.category)}
              <span className="capitalize">{notification.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{new Date(notification.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStar(notification.id)}
            className={`p-1 rounded hover:bg-gray-100 ${
              notification.starred ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            <Star className={`h-4 w-4 ${notification.starred ? 'fill-current' : ''}`} />
          </button>
          
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => onDelete(notification.id)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const NotificationSettings: React.FC<{
  preferences: NotificationPreferences
  onUpdate: (preferences: NotificationPreferences) => void
}> = ({ preferences, onUpdate }) => {
  const [localPreferences, setLocalPreferences] = useState(preferences)

  const handleToggle = (path: string, value: boolean) => {
    const newPreferences = { ...localPreferences }
    const keys = path.split('.')
    let current: any = newPreferences
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setLocalPreferences(newPreferences)
    onUpdate(newPreferences)
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </h3>
        <div className="space-y-3">
          {Object.entries(localPreferences.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {key.replace('_', ' ')}
              </label>
              <button
                onClick={() => handleToggle(`email.${key}`, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Push Notifications
        </h3>
        <div className="space-y-3">
          {Object.entries(localPreferences.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {key.replace('_', ' ')}
              </label>
              <button
                onClick={() => handleToggle(`push.${key}`, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Frequency</h3>
        <select
          value={localPreferences.frequency}
          onChange={(e) => {
            const newPreferences = { ...localPreferences, frequency: e.target.value as any }
            setLocalPreferences(newPreferences)
            onUpdate(newPreferences)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="immediate">Immediate</option>
          <option value="daily">Daily Digest</option>
          <option value="weekly">Weekly Summary</option>
        </select>
      </div>

      {/* Quiet Hours */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Enable Quiet Hours</label>
            <button
              onClick={() => handleToggle('quiet_hours.enabled', !localPreferences.quiet_hours.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localPreferences.quiet_hours.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.quiet_hours.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {localPreferences.quiet_hours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={localPreferences.quiet_hours.start}
                  onChange={(e) => {
                    const newPreferences = {
                      ...localPreferences,
                      quiet_hours: { ...localPreferences.quiet_hours, start: e.target.value }
                    }
                    setLocalPreferences(newPreferences)
                    onUpdate(newPreferences)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={localPreferences.quiet_hours.end}
                  onChange={(e) => {
                    const newPreferences = {
                      ...localPreferences,
                      quiet_hours: { ...localPreferences.quiet_hours, end: e.target.value }
                    }
                    setLocalPreferences(newPreferences)
                    onUpdate(newPreferences)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EnhancedNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'starred' | 'settings'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      project_updates: true,
      task_assignments: true,
      deadline_reminders: true,
      meeting_invites: true,
      system_alerts: true
    },
    push: {
      project_updates: true,
      task_assignments: true,
      deadline_reminders: true,
      meeting_invites: true,
      system_alerts: true
    },
    frequency: 'immediate',
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  })

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      if (!user) return
      
      // Load real notifications from database
      const response = await fetch(`/api/notifications?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const realNotifications = Array.isArray(data) ? data : data.notifications || []
        setNotifications(realNotifications)
      } else {
        // If API fails, show empty state
        setNotifications([])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
    toast.success('Notification marked as read')
  }

  const handleStar = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, starred: !n.starred } : n
    ))
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast.success('Notification deleted')
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const handleUpdatePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences)
    toast.success('Notification preferences updated')
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'unread' && !notification.read) ||
      (activeTab === 'starred' && notification.starred)
    
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter
    
    return matchesTab && matchesSearch && matchesType && matchesCategory
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const starredCount = notifications.filter(n => n.starred).length

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">Manage your notifications and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
              >
                <Check className="h-4 w-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All', count: notifications.length },
                { id: 'unread', label: 'Unread', count: unreadCount },
                { id: 'starred', label: 'Starred', count: starredCount },
                { id: 'settings', label: 'Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'settings' ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <NotificationSettings
              preferences={preferences}
              onUpdate={handleUpdatePreferences}
            />
          </div>
        ) : (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="project">Project</option>
                  <option value="task">Task</option>
                  <option value="meeting">Meeting</option>
                  <option value="system">System</option>
                  <option value="team">Team</option>
                </select>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                  <p className="text-gray-600">
                    {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'You\'re all caught up!'
                    }
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onStar={handleStar}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}














