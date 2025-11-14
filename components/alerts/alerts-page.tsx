'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { Bell, AlertCircle, Clock, CheckCircle, X, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Alert {
  id: string
  title: string
  description?: string
  type: 'overdue' | 'upcoming' | 'risk' | 'info'
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  daysOverdue?: number
  timestamp: string
  taskId?: string
  projectId?: string
}

export default function AlertsPage() {
  const { user, loading } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming' | 'risk'>('all')

  useEffect(() => {
    if (user) {
      loadAlerts()
    }
  }, [user])

  const loadAlerts = async () => {
    try {
      setLoadingData(true)
      
      // Get auth token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders = session?.access_token 
        ? { 'Authorization': `Bearer ${session.access_token}` }
        : {}
      
      // Fetch tasks
      const tasksRes = await fetch('/api/tasks', { headers: authHeaders })
      const tasksData = tasksRes.ok ? await tasksRes.json() : []
      const allTasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || []

      // Generate alerts from tasks
      const generatedAlerts: Alert[] = []
      const now = new Date()

      allTasks.forEach((task: any) => {
        if (task.status === 'completed') return

        if (task.due_date) {
          const dueDate = new Date(task.due_date)
          const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

          if (daysDiff > 0) {
            // Overdue task
            generatedAlerts.push({
              id: task.id,
              title: task.title || 'Untitled Task',
              description: task.description,
              type: 'overdue',
              priority: daysDiff > 7 ? 'high' : daysDiff > 3 ? 'medium' : 'low',
              dueDate: task.due_date,
              daysOverdue: daysDiff,
              timestamp: task.due_date,
              taskId: task.id,
              projectId: task.project_id
            })
          } else if (daysDiff >= -7 && daysDiff < 0) {
            // Upcoming deadline (within 7 days)
            generatedAlerts.push({
              id: `upcoming-${task.id}`,
              title: task.title || 'Untitled Task',
              description: task.description,
              type: 'upcoming',
              priority: Math.abs(daysDiff) <= 1 ? 'high' : Math.abs(daysDiff) <= 3 ? 'medium' : 'low',
              dueDate: task.due_date,
              daysOverdue: Math.abs(daysDiff),
              timestamp: task.due_date,
              taskId: task.id,
              projectId: task.project_id
            })
          }
        }

        // High priority tasks
        if (task.priority === 'urgent' || task.priority === 'high') {
          generatedAlerts.push({
            id: `priority-${task.id}`,
            title: task.title || 'Untitled Task',
            description: task.description,
            type: 'risk',
            priority: task.priority === 'urgent' ? 'high' : 'medium',
            timestamp: task.created_at || new Date().toISOString(),
            taskId: task.id,
            projectId: task.project_id
          })
        }
      })

      // Sort alerts by priority and timestamp
      generatedAlerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      setAlerts(generatedAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoadingData(false)
    }
  }

  const handleDismiss = async (alertId: string) => {
    // Remove alert from list (could persist dismissal in database)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
    toast.success('Alert dismissed')
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'upcoming':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'risk':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return <Bell className="h-5 w-5 text-blue-600" />
    }
  }

  const getAlertColor = (type: string, priority: string) => {
    if (type === 'overdue') {
      return priority === 'high' 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }
    if (type === 'upcoming') {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }
    if (type === 'risk') {
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    }
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.type === filter
  })

  const overdueAlerts = alerts.filter(a => a.type === 'overdue')
  const upcomingAlerts = alerts.filter(a => a.type === 'upcoming')
  const riskAlerts = alerts.filter(a => a.type === 'risk')

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Bell className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Smart Notifications</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Stay on top of deadlines and important tasks</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Overdue ({overdueAlerts.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-yellow-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Upcoming ({upcomingAlerts.length})
          </button>
          <button
            onClick={() => setFilter('risk')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'risk'
                ? 'bg-orange-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            High Priority ({riskAlerts.length})
          </button>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Bell className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No alerts</h3>
            <p className="text-gray-600 dark:text-gray-400">You're all caught up! No pending alerts.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${getAlertColor(alert.type, alert.priority)} p-4 sm:p-6`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {alert.type === 'overdue' ? 'Overdue Task' : 
                             alert.type === 'upcoming' ? 'Upcoming Deadline' :
                             alert.type === 'risk' ? 'High Priority Task' : 'Alert'}
                          </h3>
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {alert.title}
                          </p>
                          {alert.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {alert.description}
                            </p>
                          )}
                          {alert.daysOverdue !== undefined && (
                            <div className="flex items-center gap-4 text-sm">
                              {alert.type === 'overdue' && (
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  Due {alert.daysOverdue} day{alert.daysOverdue !== 1 ? 's' : ''} ago
                                </span>
                              )}
                              {alert.type === 'upcoming' && (
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                  Due in {alert.daysOverdue} day{alert.daysOverdue !== 1 ? 's' : ''}
                                </span>
                              )}
                              {alert.dueDate && (
                                <span className="text-gray-500 dark:text-gray-400">
                                  {new Date(alert.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {alert.taskId && (
                        <div className="mt-3">
                          <Link
                            href={`/tasks?taskId=${alert.taskId}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            View Task <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

