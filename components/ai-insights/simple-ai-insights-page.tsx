'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { 
  Brain, 
  TrendingUp,
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  BarChart3,
  Target,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AIInsight {
  id: string
  type: 'optimization' | 'risk' | 'achievement' | 'prediction'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  actionable: boolean
  category: string
  created_at: string
}

const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'bg-green-100 text-green-800 border-green-200'
      case 'risk': return 'bg-red-100 text-red-800 border-red-200'
      case 'achievement': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'prediction': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <Zap className="h-5 w-5" />
      case 'risk': return <AlertTriangle className="h-5 w-5" />
      case 'achievement': return <CheckCircle className="h-5 w-5" />
      case 'prediction': return <TrendingUp className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getTypeColor(insight.type)}`}>
            {getTypeIcon(insight.type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{insight.title}</h3>
            <p className="text-sm text-gray-600">{insight.category}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${getImpactColor(insight.impact)}`}>
            {insight.impact} impact
          </span>
          <p className="text-xs text-gray-500">{insight.confidence}% confidence</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{insight.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(insight.type)}`}>
            {insight.type}
          </span>
          {insight.actionable && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Actionable
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(insight.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

const MetricsCard: React.FC<{
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string
}> = ({ title, value, icon, color = 'blue' }) => {
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function SimpleAIInsightsPage() {
  const { user, loading } = useAuth()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

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
      
      // Fetch real tasks and projects (API now uses auth token, not userId param)
      const [tasksRes, projectsRes, insightsRes] = await Promise.all([
        fetch('/api/tasks', { headers: authHeaders }),
        fetch('/api/projects', { headers: authHeaders }),
        fetch(`/api/ai-insights?userId=${user?.id}`, { headers: authHeaders })
      ])

      const tasksData = tasksRes.ok ? await tasksRes.json() : []
      const projectsData = projectsRes.ok ? await projectsRes.json() : []
      const insightsData = insightsRes.ok ? await insightsRes.json() : { insights: [] }

      setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || [])
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData.projects || [])
      setInsights(insightsData.insights || [])
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const generateInsights = async () => {
    if (!user) return

    try {
      setGenerating(true)
      console.log('🤖 Generating AI insights...')

      const response = await fetch('/api/ai-insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate insights')
      }

      const data = await response.json()
      console.log('✅ AI insights generated:', data)

      if (data.insights) {
        setInsights(data.insights)
        toast.success('AI insights generated successfully!')
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      toast.error('Failed to generate insights')
    } finally {
      setGenerating(false)
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
          <p className="text-gray-600">You need to be logged in to access AI insights.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">AI Insights</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Intelligent analysis and recommendations powered by AI</p>
              </div>
            </div>
            <button
              onClick={generateInsights}
              disabled={generating || loadingData}
              className="px-4 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors touch-manipulation w-full sm:w-auto"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Generate Insights
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Tasks"
            value={tasks.length}
            icon={<BarChart3 className="h-6 w-6" />}
            color="blue"
          />
          <MetricsCard
            title="Completed"
            value={tasks.filter(t => t.status === 'completed').length}
            icon={<CheckCircle className="h-6 w-6" />}
            color="green"
          />
          <MetricsCard
            title="In Progress"
            value={tasks.filter(t => t.status === 'in_progress').length}
            icon={<Clock className="h-6 w-6" />}
            color="yellow"
          />
          <MetricsCard
            title="Active Projects"
            value={projects.filter(p => p.status === 'active').length}
            icon={<Target className="h-6 w-6" />}
            color="purple"
          />
        </div>

        {/* AI Insights Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">AI-Generated Insights</h2>
            <span className="text-sm text-gray-500">{insights.length} insights available</span>
          </div>

          {loadingData ? (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading insights...</p>
            </div>
          ) : generating ? (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">AI is analyzing your tasks and projects...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          ) : insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights yet</h3>
              <p className="text-gray-600 mb-6">Generate AI-powered insights from your projects and tasks</p>
              <button
                onClick={generateInsights}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
              >
                <Brain className="h-5 w-5" />
                Generate AI Insights
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Smart Recommendations</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Get personalized recommendations to optimize your workflow and improve productivity.
            </p>
            <button 
              onClick={generateInsights}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
            >
              Generate recommendations →
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Project Health</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Monitor your project health with AI-powered analysis and early risk detection.
            </p>
            <button 
              onClick={generateInsights}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              Analyze projects →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
