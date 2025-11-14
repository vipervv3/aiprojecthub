'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { 
  Brain, 
  TrendingUp,
  TrendingDown,
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  BarChart3,
  Clock,
  Activity,
  ChevronDown
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Metrics {
  productivityTrend: number
  teamEfficiency: number
  burnoutRisk: string
  upcomingDeadlines: number
  projectsAtRisk: number
  productivityScore: number
}

interface AISummary {
  tasksCompletedToday: number
  upcomingDeadlines: number
  projectsAtRisk: number
  productivityScore: number
  recommendations: Array<{
    id: string
    title: string
    description: string
    nextStep: string
    priority: 'high' | 'medium' | 'low'
  }>
}

export default function SimpleAIInsightsPage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [metrics, setMetrics] = useState<Metrics>({
    productivityTrend: -15,
    teamEfficiency: 20,
    burnoutRisk: 'Low',
    upcomingDeadlines: 0,
    projectsAtRisk: 1,
    productivityScore: 45
  })
  const [aiSummary, setAiSummary] = useState<AISummary>({
    tasksCompletedToday: 0,
    upcomingDeadlines: 0,
    projectsAtRisk: 1,
    productivityScore: 45,
    recommendations: []
  })
  const [selectedProject, setSelectedProject] = useState<string>('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoadingData(true)
      
      // Get auth token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const authHeaders = session?.access_token 
        ? { 'Authorization': `Bearer ${session.access_token}` }
        : {}
      
      // Fetch real tasks and projects
      const [tasksRes, projectsRes] = await Promise.all([
        fetch('/api/tasks', { headers: authHeaders }),
        fetch('/api/projects', { headers: authHeaders })
      ])

      const tasksData = tasksRes.ok ? await tasksRes.json() : []
      const projectsData = projectsRes.ok ? await projectsRes.json() : []

      const allTasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || []
      const allProjects = Array.isArray(projectsData) ? projectsData : projectsData.projects || []

      console.log('📊 Loaded live data:', {
        tasks: allTasks.length,
        projects: allProjects.length,
        completedTasks: allTasks.filter((t: any) => t.status === 'completed').length,
        inProgressTasks: allTasks.filter((t: any) => t.status === 'in_progress').length
      })

      setTasks(allTasks)
      setProjects(allProjects)

      // Calculate metrics
      const completedToday = allTasks.filter((t: any) => {
        if (t.status !== 'completed' || !t.updated_at) return false
        const updatedDate = new Date(t.updated_at)
        const today = new Date()
        return updatedDate.toDateString() === today.toDateString()
      }).length

      const upcomingDeadlines = allTasks.filter((t: any) => {
        if (!t.due_date || t.status === 'completed') return false
        const dueDate = new Date(t.due_date)
        const today = new Date()
        const weekFromNow = new Date(today)
        weekFromNow.setDate(today.getDate() + 7)
        return dueDate >= today && dueDate <= weekFromNow
      }).length

      const overdueTasks = allTasks.filter((t: any) => {
        if (!t.due_date || t.status === 'completed') return false
        const dueDate = new Date(t.due_date)
        const today = new Date()
        return dueDate < today
      }).length

      const projectsAtRisk = allProjects.filter((p: any) => {
        return p.status === 'at_risk' || p.status === 'on_hold'
      }).length

      // Calculate productivity score (simple calculation)
      const totalTasks = allTasks.length
      const completedTasks = allTasks.filter((t: any) => t.status === 'completed').length
      const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Calculate productivity trend (comparing this week to last week)
      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      const twoWeeksAgo = new Date(now)
      twoWeeksAgo.setDate(now.getDate() - 14)

      const completedThisWeek = allTasks.filter((t: any) => {
        if (t.status !== 'completed' || !t.updated_at) return false
        const updatedDate = new Date(t.updated_at)
        return updatedDate >= weekAgo
      }).length

      const completedLastWeek = allTasks.filter((t: any) => {
        if (t.status !== 'completed' || !t.updated_at) return false
        const updatedDate = new Date(t.updated_at)
        return updatedDate >= twoWeeksAgo && updatedDate < weekAgo
      }).length

      const trend = completedLastWeek > 0 
        ? Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)
        : 0

      // Calculate team efficiency
      const inProgressTasks = allTasks.filter((t: any) => t.status === 'in_progress').length
      const efficiency = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0

      // Determine burnout risk
      const overdueCount = overdueTasks
      const burnoutRisk = overdueCount > 5 ? 'High' : overdueCount > 2 ? 'Medium' : 'Low'

      const calculatedMetrics = {
        productivityTrend: trend,
        teamEfficiency: efficiency,
        burnoutRisk,
        upcomingDeadlines,
        projectsAtRisk,
        productivityScore
      }

      console.log('📈 Calculated metrics from live data:', calculatedMetrics)
      
      setMetrics(calculatedMetrics)

      // Generate AI Summary with recommendations
      const recommendations: AISummary['recommendations'] = []
      
      if (projectsAtRisk > 0) {
        const atRiskProject = allProjects.find((p: any) => p.status === 'at_risk' || p.status === 'on_hold')
        if (atRiskProject) {
          recommendations.push({
            id: '1',
            title: `${atRiskProject.name} Preparations`,
            description: `Consider scheduling and consolidating your meetings related to ${atRiskProject.name} to increase efficiency. Specifically, combine discussions on the agenda and food items into a single session as much as possible to streamline decision-making.`,
            nextStep: `Send out a Doodle poll to find common availability for all key stakeholders and lock these meetings in the calendar.`,
            priority: 'high'
          })
        }
      }

      if (overdueTasks > 0) {
        recommendations.push({
          id: '2',
          title: 'High-Priority Tasks from Last Week',
          description: `You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''} that need immediate attention. Review and prioritize these tasks to prevent further delays.`,
          nextStep: 'Review the Alerts page to see all overdue tasks and prioritize them.',
          priority: 'high'
        })
      }

      setAiSummary({
        tasksCompletedToday: completedToday,
        upcomingDeadlines,
        projectsAtRisk,
        productivityScore,
        recommendations
      })

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }


  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Please log in</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be logged in to access AI insights.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">AI Insights</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Intelligent analysis and project recommendations</p>
            </div>
          </div>
        </div>

        {/* Top Metrics - 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Productivity Trend */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productivity Trend</p>
              {metrics.productivityTrend >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className={`text-3xl font-bold ${metrics.productivityTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.productivityTrend >= 0 ? '+' : ''}{metrics.productivityTrend}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {metrics.productivityTrend >= 0 ? 'Up from last week' : 'Down from last week'}
            </p>
          </div>

          {/* Team Efficiency */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team Efficiency</p>
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.teamEfficiency}%</p>
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.teamEfficiency}%` }}
                />
              </div>
            </div>
          </div>

          {/* Burnout Risk */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Burnout Risk</p>
              <AlertTriangle className={`h-5 w-5 ${
                metrics.burnoutRisk === 'Low' ? 'text-green-600' :
                metrics.burnoutRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
            <p className={`text-3xl font-bold ${
              metrics.burnoutRisk === 'Low' ? 'text-green-600' :
              metrics.burnoutRisk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.burnoutRisk}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {metrics.burnoutRisk === 'Low' ? 'Healthy' : 'Monitor closely'}
            </p>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Deadlines</p>
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.upcomingDeadlines}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Next 7 days</p>
          </div>

          {/* Projects at Risk */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects at Risk</p>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.projectsAtRisk}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Need attention</p>
          </div>

          {/* Productivity Score */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productivity Score</p>
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{metrics.productivityScore}%</p>
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${metrics.productivityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Today's AI Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Today's AI Summary</h2>
          
          {/* Sub-metrics - Only showing unique metrics not in top cards */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{aiSummary.tasksCompletedToday}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tasks Completed Today</p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">AI Recommendations for Today</h3>
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Urgent Priorities and Suggested Actions:</p>
              
              {aiSummary.recommendations.length > 0 ? (
                aiSummary.recommendations.map((rec, idx) => (
                  <div key={rec.id} className="border-l-4 border-purple-600 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{idx + 1}. {rec.title}:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{rec.description}</p>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Suggested next step: {rec.nextStep}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No urgent recommendations at this time.</p>
              )}
            </div>
          </div>
        </div>

        {/* Project Health Analysis & Smart Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Health Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Health Analysis</h3>
            
            <div className="mb-4">
              <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Project
              </label>
              <div className="relative">
                <select
                  id="project-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a project to analyze...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || 'Unnamed Project'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {!selectedProject && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">Select a project to view AI insights</p>
              </div>
            )}

            {selectedProject && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Analyze Project Health" to generate AI-powered insights for this project.
                </p>
              </div>
            )}
          </div>

          {/* Smart Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Smart Recommendations</h3>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Project recommendations will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
