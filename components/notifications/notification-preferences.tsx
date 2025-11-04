'use client'

import { useState } from 'react'
import { Bell, Mail, Smartphone, Clock } from 'lucide-react'
import { NOTIFICATION_TEMPLATES } from '@/lib/notifications/notification-types'

interface NotificationPreferencesProps {
  preferences: any
  onUpdate: (preferences: any) => void
}

export default function NotificationPreferences({ preferences, onUpdate }: NotificationPreferencesProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences)

  const notificationCategories = [
    {
      id: 'daily',
      title: 'Daily Notifications',
      icon: Clock,
      description: 'Daily summaries and reminders',
      notifications: [
        'morning_notification',
        'evening_summary',
        'daily_digest'
      ]
    },
    {
      id: 'tasks',
      title: 'Task Notifications',
      icon: Bell,
      description: 'Task-related alerts and updates',
      notifications: [
        'task_due',
        'task_overdue',
        'task_completed',
        'task_assigned',
        'task_priority_changed'
      ]
    },
    {
      id: 'projects',
      title: 'Project Notifications',
      icon: Bell,
      description: 'Project updates and milestones',
      notifications: [
        'project_update',
        'project_deadline',
        'project_completed',
        'project_at_risk',
        'project_milestone'
      ]
    },
    {
      id: 'meetings',
      title: 'Meeting Notifications',
      icon: Bell,
      description: 'Meeting reminders and updates',
      notifications: [
        'meeting_reminder',
        'meeting_starting',
        'meeting_completed',
        'meeting_cancelled'
      ]
    },
    {
      id: 'ai',
      title: 'AI Insights',
      icon: Bell,
      description: 'AI-powered insights and recommendations',
      notifications: [
        'ai_insight',
        'ai_recommendation',
        'ai_alert',
        'smart_alert'
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: Bell,
      description: 'Weekly and monthly reports',
      notifications: [
        'weekly_report',
        'monthly_report',
        'productivity_report'
      ]
    }
  ]

  const deliveryMethods = [
    {
      id: 'email',
      title: 'Email',
      icon: Mail,
      description: 'Receive notifications via email'
    },
    {
      id: 'push',
      title: 'Push Notifications',
      icon: Smartphone,
      description: 'Receive push notifications in the app'
    },
    {
      id: 'in_app',
      title: 'In-App',
      icon: Bell,
      description: 'Show notifications in the app'
    }
  ]

  const handleToggle = (notificationType: string, method: string) => {
    const key = `${method}_${notificationType}`
    const newPreferences = {
      ...localPreferences,
      [key]: !localPreferences[key]
    }
    setLocalPreferences(newPreferences)
    onUpdate(newPreferences)
  }

  const handleCategoryToggle = (categoryId: string, method: string) => {
    const category = notificationCategories.find(c => c.id === categoryId)
    if (!category) return

    const newPreferences = { ...localPreferences }
    
    // Check if all notifications in this category are enabled
    const allEnabled = category.notifications.every(
      notificationType => localPreferences[`${method}_${notificationType}`] !== false
    )

    // Toggle all notifications in this category
    category.notifications.forEach(notificationType => {
      const key = `${method}_${notificationType}`
      newPreferences[key] = !allEnabled
    })

    setLocalPreferences(newPreferences)
    onUpdate(newPreferences)
  }

  const isCategoryEnabled = (categoryId: string, method: string) => {
    const category = notificationCategories.find(c => c.id === categoryId)
    if (!category) return false

    return category.notifications.every(
      notificationType => localPreferences[`${method}_${notificationType}`] !== false
    )
  }

  const isNotificationEnabled = (notificationType: string, method: string) => {
    return localPreferences[`${method}_${notificationType}`] !== false
  }

  return (
    <div className="space-y-8">
      {/* Delivery Methods */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Delivery Methods</h3>
          <p className="card-description">
            Choose how you want to receive notifications
          </p>
        </div>
        
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deliveryMethods.map((method) => (
              <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <method.icon className="h-5 w-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{method.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences[`${method.id}_enabled`] !== false}
                    onChange={() => {
                      const newPreferences = {
                        ...localPreferences,
                        [`${method.id}_enabled`]: !localPreferences[`${method.id}_enabled`]
                      }
                      setLocalPreferences(newPreferences)
                      onUpdate(newPreferences)
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {localPreferences[`${method.id}_enabled`] !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      {deliveryMethods.map((method) => (
        <div key={method.id} className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <method.icon className="h-5 w-5 text-gray-600" />
              <h3 className="card-title">{method.title} Notifications</h3>
            </div>
            <p className="card-description">
              Configure which notifications you want to receive via {method.title.toLowerCase()}
            </p>
          </div>
          
          <div className="card-content">
            <div className="space-y-6">
              {notificationCategories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <category.icon className="h-5 w-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{category.title}</h4>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCategoryEnabled(category.id, method.id)}
                        onChange={() => handleCategoryToggle(category.id, method.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.notifications.map((notificationType) => {
                      const template = NOTIFICATION_TEMPLATES[notificationType as keyof typeof NOTIFICATION_TEMPLATES]
                      return (
                        <div key={notificationType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{template.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{template.title}</p>
                              <p className="text-xs text-gray-600">{template.message}</p>
                            </div>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isNotificationEnabled(notificationType, method.id)}
                              onChange={() => handleToggle(notificationType, method.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Timing Preferences */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Timing Preferences</h3>
          <p className="card-description">
            Set your preferred times for different types of notifications
          </p>
        </div>
        
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Morning Notification Time</label>
              <input
                type="time"
                value={localPreferences.morning_notification_time || '08:00'}
                onChange={(e) => {
                  const newPreferences = {
                    ...localPreferences,
                    morning_notification_time: e.target.value
                  }
                  setLocalPreferences(newPreferences)
                  onUpdate(newPreferences)
                }}
                className="input mt-1"
              />
            </div>
            
            <div>
              <label className="label">Evening Summary Time</label>
              <input
                type="time"
                value={localPreferences.evening_summary_time || '18:00'}
                onChange={(e) => {
                  const newPreferences = {
                    ...localPreferences,
                    evening_summary_time: e.target.value
                  }
                  setLocalPreferences(newPreferences)
                  onUpdate(newPreferences)
                }}
                className="input mt-1"
              />
            </div>
            
            <div>
              <label className="label">Quiet Hours Start</label>
              <input
                type="time"
                value={localPreferences.quiet_hours_start || '22:00'}
                onChange={(e) => {
                  const newPreferences = {
                    ...localPreferences,
                    quiet_hours_start: e.target.value
                  }
                  setLocalPreferences(newPreferences)
                  onUpdate(newPreferences)
                }}
                className="input mt-1"
              />
            </div>
            
            <div>
              <label className="label">Quiet Hours End</label>
              <input
                type="time"
                value={localPreferences.quiet_hours_end || '07:00'}
                onChange={(e) => {
                  const newPreferences = {
                    ...localPreferences,
                    quiet_hours_end: e.target.value
                  }
                  setLocalPreferences(newPreferences)
                  onUpdate(newPreferences)
                }}
                className="input mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


