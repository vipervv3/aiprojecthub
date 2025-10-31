'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock,
  CheckCircle,
  Target,
  Activity,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AnalyticsData {
  totalProjects: number
  completedProjects: number
  activeProjects: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  completionRate: number
  projectStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
}

const MetricCard: React.FC<{
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string
  subtitle?: string
}> = ({ title, value, icon, color = 'blue', subtitle }) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-600'
      case 'red': return 'bg-red-100 text-red-600'
      case 'yellow': return 'bg-yellow-100 text-yellow-600'
      case 'purple': return 'bg-purple-100 text-purple-600'
      default: return 'bg-blue-100 text-blue-600'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

const StatusDistribution: React.FC<{ data: AnalyticsData['projectStatus'] }> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No projects yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
      <div className="space-y-4">
        {data.filter(s => s.count > 0).map((status, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 capitalize">
                {status.status.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-600">
                {status.count} ({status.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  status.status === 'active' ? 'bg-blue-500' :
                  status.status === 'completed' ? 'bg-green-500' :
                  status.status === 'on_hold' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}
                style={{ width: `${status.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TaskBreakdown: React.FC<{ data: AnalyticsData }> = ({ data }) => {
  const tasks = [
    { label: 'Completed', count: data.completedTasks, color: 'bg-green-500' },
    { label: 'In Progress', count: data.inProgressTasks, color: 'bg-blue-500' },
    { label: 'To Do', count: data.todoTasks, color: 'bg-gray-400' }
  ]

  const total = data.totalTasks

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Breakdown</h3>
      {total > 0 ? (
        <div className="space-y-4">
          {tasks.filter(t => t.count > 0).map((task, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{task.label}</span>
                <span className="text-sm text-gray-600">
                  {task.count} ({Math.round((task.count / total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${task.color}`}
                  style={{ width: `${(task.count / total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No tasks yet</p>
        </div>
      )}
    </div>
  )
}

export default function SimpleAnalyticsPage() {
  const { user, loading } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalProjects: 0,
    completedProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    completionRate: 0,
    projectStatus: []
  })
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  const loadAnalytics = async () => {
    try {
      setLoadingData(true)
      
      // Fetch real data
      const [projectsRes, tasksRes] = await Promise.all([
        fetch(`/api/projects?userId=${user?.id}`),
        fetch(`/api/tasks?userId=${user?.id}`)
      ])

      const projectsData = projectsRes.ok ? await projectsRes.json() : []
      const tasksData = tasksRes.ok ? await tasksRes.json() : []

      const projects = Array.isArray(projectsData) ? projectsData : projectsData.projects || []
      const tasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || []

      // Calculate analytics
      const totalProjects = projects.length
      const completedProjects = projects.filter((p: any) => p.status === 'completed').length
      const activeProjects = projects.filter((p: any) => p.status === 'active').length

      const totalTasks = tasks.length
      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
      const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length
      const todoTasks = tasks.filter((t: any) => t.status === 'todo').length

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Calculate project status distribution
      const statusCounts: Record<string, number> = {}
      projects.forEach((p: any) => {
        const status = p.status || 'active'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })

      const projectStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number,
        percentage: totalProjects > 0 ? Math.round((count as number / totalProjects) * 100) : 0
      }))

      setAnalyticsData({
        totalProjects,
        completedProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        completionRate,
        projectStatus
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoadingData(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to access analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Real-time insights from your projects and tasks</p>
              </div>
            </div>
            <button
              onClick={loadAnalytics}
              disabled={loadingData}
              className="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Total Projects"
                value={analyticsData.totalProjects}
                icon={<Target className="h-6 w-6" />}
                color="blue"
                subtitle={`${analyticsData.activeProjects} active`}
              />
              <MetricCard
                title="Completed Projects"
                value={analyticsData.completedProjects}
                icon={<CheckCircle className="h-6 w-6" />}
                color="green"
                subtitle={analyticsData.totalProjects > 0 
                  ? `${Math.round((analyticsData.completedProjects / analyticsData.totalProjects) * 100)}% completion`
                  : '0% completion'}
              />
              <MetricCard
                title="Total Tasks"
                value={analyticsData.totalTasks}
                icon={<Activity className="h-6 w-6" />}
                color="purple"
                subtitle={`${analyticsData.completedTasks} completed`}
              />
              <MetricCard
                title="Completion Rate"
                value={`${analyticsData.completionRate}%`}
                icon={<TrendingUp className="h-6 w-6" />}
                color="yellow"
                subtitle={`${analyticsData.inProgressTasks} in progress`}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <StatusDistribution data={analyticsData.projectStatus} />
              <TaskBreakdown data={analyticsData} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">{analyticsData.activeProjects}</p>
                <p className="text-sm text-gray-600">Currently in progress</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasks Completed</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">{analyticsData.completedTasks}</p>
                <p className="text-sm text-gray-600">Out of {analyticsData.totalTasks} total</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">In Progress</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">{analyticsData.inProgressTasks}</p>
                <p className="text-sm text-gray-600">Tasks being worked on</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
