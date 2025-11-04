'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Search, 
  Download,
  BarChart3,
  Eye,
  MoreVertical,
  Calendar
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
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  project_id: string
  due_date?: string
}

export default function EnhancedReportsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          setLoadingData(true)
          const userId = user.id || 'demo-user'
          
          const [projectsData, tasksData] = await Promise.all([
            dataService.getProjects(userId),
            dataService.getTasks(userId)
          ])
          
          setProjects(projectsData)
          setTasks(tasksData)
        } catch (error) {
          console.error('Error loading data:', error)
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadData()
  }, [user])

  // Calculate metrics
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const avgCompletion = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0
  const uniqueTeamMembers = new Set(
    projects.flatMap(p => Array.isArray(p.team_members) ? p.team_members : [])
  ).size

  // Get tasks for each project
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(t => t.project_id === projectId)
  }

  const getCompletedTasks = (projectId: string) => {
    return tasks.filter(t => t.project_id === projectId && t.status === 'completed').length
  }

  const getTotalTasks = (projectId: string) => {
    return tasks.filter(t => t.project_id === projectId).length
  }

  const getProjectStatus = (project: Project) => {
    const projectTasks = getProjectTasks(project.id)
    const overdueTasks = projectTasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < new Date()
    })
    
    if (overdueTasks.length > 0) return 'At Risk'
    if (project.progress > 0) return 'In Progress'
    return 'Planning'
  }


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || getProjectStatus(project).toLowerCase().includes(statusFilter.toLowerCase())
    return matchesSearch && matchesStatus
  })

  const handleExport = () => {
    // Export to CSV
    const csvHeaders = ['Project Name', 'Start Date', 'Due Date', 'Status', 'Progress', 'Tasks', 'Team Members']
    const csvRows = filteredProjects.map(project => [
      project.name,
      formatDate(project.start_date),
      formatDate(project.due_date),
      getProjectStatus(project),
      `${project.progress}%`,
      `${getCompletedTasks(project.id)}/${getTotalTasks(project.id)}`,
      Array.isArray(project.team_members) ? project.team_members.length : 1
    ])
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-reports-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
          <p className="text-gray-600">You need to be logged in to access reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Project Reports</h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Comprehensive overview of all projects with detailed metrics and status tracking
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-manipulation"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => router.push('/analytics')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Projects */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{totalProjects}</p>
              <p className="text-sm text-gray-500 mt-1">Active projects</p>
            </div>
          </div>

          {/* Avg Completion */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Completion</p>
              <p className="text-3xl font-bold text-gray-900">{avgCompletion}%</p>
              <p className="text-sm text-gray-500 mt-1">Overall progress</p>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Team Members</p>
              <p className="text-3xl font-bold text-gray-900">{uniqueTeamMembers || totalProjects}</p>
              <p className="text-sm text-gray-500 mt-1">Across all projects</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="in progress">In Progress</option>
              <option value="at risk">At Risk</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Project Overview Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Project Overview ({filteredProjects.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const projectStatus = getProjectStatus(project)
                    const completedTasks = getCompletedTasks(project.id)
                    const totalTasks = getTotalTasks(project.id)
                    const teamCount = Array.isArray(project.team_members) ? project.team_members.length : 1

                    return (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                              onClick={() => router.push(`/reports/${project.id}`)}
                            >
                              {project.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {completedTasks}/{totalTasks} tasks
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(project.start_date || project.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(project.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            projectStatus === 'At Risk' 
                              ? 'bg-red-100 text-red-800'
                              : projectStatus === 'In Progress'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {projectStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600">{project.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    project.progress >= 75 ? 'bg-green-500' :
                                    project.progress >= 50 ? 'bg-blue-500' :
                                    project.progress >= 25 ? 'bg-yellow-500' :
                                    'bg-gray-400'
                                  }`}
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 w-16 text-right">
                              {project.progress}% complete
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>{teamCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/reports/${project.id}`)}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
