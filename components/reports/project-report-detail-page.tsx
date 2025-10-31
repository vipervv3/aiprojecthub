'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Edit,
  Share2,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  User
} from 'lucide-react'
import { dataService } from '@/lib/data-service'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  progress: number
  due_date?: string
  start_date?: string
  team_members?: any[]
  created_at: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  start_date?: string
  project_id: string
  assignee_id?: string
  created_at: string
  progress?: number
}

export default function ProjectReportDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (user && projectId) {
        try {
          setLoadingData(true)
          const userId = user.id || 'demo-user'
          
          const [projectsData, tasksData] = await Promise.all([
            dataService.getProjects(userId),
            dataService.getTasks(userId)
          ])
          
          const foundProject = projectsData.find(p => p.id === projectId)
          setProject(foundProject || null)
          
          const projectTasks = tasksData.filter(t => t.project_id === projectId)
          setTasks(projectTasks)
        } catch (error) {
          console.error('Error loading data:', error)
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadData()
  }, [user, projectId])

  // Calculate metrics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const todoTasks = tasks.filter(t => t.status === 'todo').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length

  // Task priority counts
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
  const highTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
  const mediumTasks = tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length
  const lowTasks = tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length

  // Overall progress
  const overallProgress = project?.progress || 0

  // Current milestone (simplified - assuming equal distribution)
  const milestoneProgress = overallProgress

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'in_progress': return 'text-blue-600 bg-blue-50'
      case 'todo': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || loadingData) {
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
          <p className="text-gray-600">You need to be logged in to access project reports.</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/reports')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Sidebar - Project Info */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Back Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => router.push('/reports')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Reports</span>
            </button>
          </div>

          {/* Overview Tab */}
          <div className="p-4 border-b border-gray-200">
            <div className="bg-gray-100 px-4 py-2 rounded text-sm font-medium text-gray-900">
              Overview
            </div>
          </div>

          {/* Project Details */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                  Project Name
                </label>
                <p className="text-base font-semibold text-gray-900">{project.name}</p>
              </div>

              {/* Project Status */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                  Project Status
                </label>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium capitalize ${getStatusBadge(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                  Start Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(project.start_date || project.created_at)}</p>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                  Due Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(project.due_date)}</p>
              </div>

              {/* Team Members */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                  Team Members
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Users className="h-4 w-4" />
                  <span>{Array.isArray(project.team_members) ? project.team_members.length : 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            <button
              onClick={() => router.push(`/projects/${project.id}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Progress Circles */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Overall Progress */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40 mb-4">
                    <svg className="transform -rotate-90 w-40 h-40">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#E5E7EB"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 70}`}
                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - overallProgress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">{overallProgress}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                </div>
              </div>

              {/* Milestone Progress */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Milestone Progress</h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#E5E7EB"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10B981"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - milestoneProgress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{milestoneProgress}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Current Milestone</p>
                </div>
              </div>
            </div>

            {/* Task Priority and Status */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Task Priority */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Priority</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Urgent</span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: totalTasks > 0 ? `${(urgentTasks / totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{urgentTasks}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">High</span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: totalTasks > 0 ? `${(highTasks / totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{highTasks}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Medium</span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: totalTasks > 0 ? `${(mediumTasks / totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{mediumTasks}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Low</span>
                    <div className="flex items-center gap-3 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-400 h-2 rounded-full"
                          style={{ width: totalTasks > 0 ? `${(lowTasks / totalTasks) * 100}%` : '0%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{lowTasks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Status and Team Estimation */}
              <div className="space-y-6">
                {/* Task Status */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Status</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-sm text-gray-700">
                      Todo ({totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {todoTasks}/{totalTasks}
                  </div>
                  <p className="text-xs text-gray-500">tasks pending</p>
                </div>

                {/* Team Estimation */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Estimation</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User className="h-4 w-4" />
                      <span>Project Owner</span>
                    </div>
                    {Array.isArray(project.team_members) && project.team_members.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <User className="h-4 w-4" />
                          <span>Team Member 1</span>
                        </div>
                        {project.team_members.length > 1 && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User className="h-4 w-4" />
                            <span>Team Member 2</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tasks <span className="text-gray-500">({completedTasks} of {totalTasks} completed)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No tasks found for this project
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{task.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(task.start_date) !== 'N/A' ? formatDate(task.start_date) : formatDate(task.created_at)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(task.due_date)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(task.status)}`}>
                              {task.status === 'todo' && '● Todo'}
                              {task.status === 'in_progress' && '● In Progress'}
                              {task.status === 'completed' && '● Completed'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">Project Owner</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {task.status === 'completed' ? '100%' : task.status === 'in_progress' ? '50%' : '0%'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

