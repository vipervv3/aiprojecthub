'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  Users, 
  Mic, 
  BarChart3,
  Calendar,
  ArrowRight,
  Video,
  FileText
} from 'lucide-react'
import { dataService } from '@/lib/data-service'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface DashboardData {
  totalProjects: number
  activeTasks: number
  completedTasks: number
  teamMembers: number
  totalRecordings: number
  recentActivity: any[]
  activeProjects: any[]
  todaysMeetings: any[]
  upcomingTasks: any[]
}

const MetricCard: React.FC<{
  title: string
  value: number
  icon: React.ReactNode
}> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center">
      <div className="p-2 bg-gray-100 rounded-lg mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
)

const AIAssistantBanner: React.FC<{ onStartRecording: () => void; onViewInsights: () => void }> = ({ 
  onStartRecording, 
  onViewInsights 
}) => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg text-white relative overflow-hidden">
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">AI-Powered Meeting Assistant</h3>
          <p className="text-blue-100 mb-4">Record meetings, transcribe automatically, and extract tasks with AI</p>
          <div className="flex gap-3">
            <button 
              onClick={onStartRecording}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </button>
            <button 
              onClick={onViewInsights}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              View AI Insights
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute top-4 right-4 text-white/30">
      <Mic className="h-16 w-16 opacity-20" />
    </div>
  </div>
)

const RecentActivity: React.FC<{ activities: any[] }> = ({ activities }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
        View all
      </button>
    </div>
    <div className="space-y-3">
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent activity</p>
      ) : (
        activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.created_at}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)

const ActiveProjects: React.FC<{ projects: any[] }> = ({ projects }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
        View all
      </button>
    </div>
    <div className="space-y-4">
      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No active projects</p>
      ) : (
        projects.map((project, index) => (
          <div key={project.id || index} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{project.name}</h4>
              <span className="text-sm text-gray-600">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)

const TodaysSchedule: React.FC<{ meetings: any[]; onViewCalendar: () => void }> = ({ meetings, onViewCalendar }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
      <button 
        onClick={onViewCalendar}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        View calendar
      </button>
    </div>
    {meetings.length === 0 ? (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No meetings today</p>
        <p className="text-gray-500 text-sm mt-2">Your scheduled meetings for today will appear here.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {meetings.map((meeting, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors">
            <Video className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{meeting.title}</p>
              <p className="text-xs text-gray-600">{meeting.time}</p>
            </div>
            {meeting.hasTranscript && (
              <FileText className="h-4 w-4 text-purple-600" />
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)

const UpcomingTasks: React.FC<{ tasks: any[]; onViewTasks: () => void }> = ({ tasks, onViewTasks }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
      <button 
        onClick={onViewTasks}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        View all
      </button>
    </div>
    {tasks.length === 0 ? (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No upcoming tasks</p>
        <p className="text-gray-500 text-sm mt-2">Tasks due this week will appear here.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
            <div className={`mt-1 w-2 h-2 rounded-full ${
              task.priority === 'urgent' ? 'bg-red-500' :
              task.priority === 'high' ? 'bg-orange-500' :
              task.priority === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-600">{task.dueDate}</p>
                {task.is_ai_generated && (
                  <span className="text-xs text-purple-600">AI</span>
                )}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
)

export default function SimpleDashboard() {
  const { user, loading, loggingOut } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
    totalRecordings: 0,
    recentActivity: [],
    activeProjects: [],
    todaysMeetings: [],
    upcomingTasks: []
  })
  const [loadingData, setLoadingData] = useState(true)
  const [showRecordingModal, setShowRecordingModal] = useState(false)

  useEffect(() => {
    const initializeDashboard = async () => {
      if (user) {
        await loadDashboardData()
      }
      setLoadingData(false)
    }
    
    initializeDashboard()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoadingData(true)

      const userId = user?.id || 'demo-user'
      
      // Load data using the data service
      const [projects, tasks, activities] = await Promise.all([
        dataService.getProjects(userId),
        dataService.getTasks(userId),
        dataService.getActivities(userId)
      ])

      // Calculate metrics
      const activeTasks = tasks.filter(task => task.status === 'todo' || task.status === 'in_progress').length
      const completedTasks = tasks.filter(task => task.status === 'completed').length

      // Load meetings and recordings from Supabase
      let totalRecordings = 0
      let todaysMeetings: any[] = []
      
      if (supabase) {
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('*')
          .order('scheduled_at', { ascending: false })
        
        if (meetingsData) {
          totalRecordings = meetingsData.length
          
          // Filter today's meetings
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          todaysMeetings = meetingsData
            .filter((meeting: any) => {
              const meetingDate = new Date(meeting.scheduled_at)
              return meetingDate >= today && meetingDate < tomorrow
            })
            .slice(0, 5)
            .map((meeting: any) => ({
              id: meeting.id,
              title: meeting.title || 'Untitled Meeting',
              time: new Date(meeting.scheduled_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              hasTranscript: !!meeting.summary
            }))
        }
      }

      // Get upcoming tasks (due within 7 days)
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
      
      const upcomingTasks = tasks
        .filter(task => {
          if (!task.due_date || task.status === 'completed') return false
          const dueDate = new Date(task.due_date)
          return dueDate <= oneWeekFromNow && dueDate >= new Date()
        })
        .sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
        })
        .slice(0, 5)
        .map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: new Date(task.due_date!).toLocaleDateString(),
          is_ai_generated: task.is_ai_generated || false
        }))

      // Format recent activity
      const recentActivity = activities.slice(0, 5).map(activity => ({
        id: activity.id,
        type: activity.action,
        message: `Someone updated task '${activity.entity_name || 'Untitled Task'}'`,
        created_at: new Date(activity.created_at).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        }),
        user: user?.user_metadata?.name || user?.email || 'You'
      }))

      // Format active projects
      const activeProjects = projects.filter(project => project.status === 'active').map(project => ({
        id: project.id,
        name: project.name,
        progress: project.progress || 0,
        status: project.status,
        dueDate: project.due_date,
        teamMembers: Array.isArray(project.team_members) ? project.team_members.length : 0
      }))

      // Calculate total team members
      const teamMembers = projects.reduce((acc, project) => {
        const members = Array.isArray(project.team_members) ? project.team_members.length : 0
        return acc + members
      }, 0)

      setDashboardData({
        totalProjects: projects.length,
        activeTasks,
        completedTasks,
        teamMembers,
        totalRecordings,
        recentActivity,
        activeProjects,
        todaysMeetings,
        upcomingTasks
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loggingOut ? 'Signing out...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.name || 'Omar'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Projects"
            value={dashboardData.totalProjects}
            icon={<FolderOpen className="h-6 w-6 text-gray-600" />}
          />
          <MetricCard
            title="Active Tasks"
            value={dashboardData.activeTasks}
            icon={<Clock className="h-6 w-6 text-gray-600" />}
          />
          <MetricCard
            title="Completed Tasks"
            value={dashboardData.completedTasks}
            icon={<CheckCircle className="h-6 w-6 text-gray-600" />}
          />
          <MetricCard
            title="Recordings"
            value={dashboardData.totalRecordings}
            icon={<Mic className="h-6 w-6 text-gray-600" />}
          />
        </div>

        {/* AI Assistant Banner */}
        <div className="mb-8">
          <AIAssistantBanner 
            onStartRecording={() => {
              // This will be handled by the FloatingRecordingButton which is already in AppLayout
              const recordButton = document.querySelector('[data-recording-button]') as HTMLButtonElement
              if (recordButton) {
                recordButton.click()
              }
            }}
            onViewInsights={() => router.push('/ai-insights')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentActivity activities={dashboardData.recentActivity} />
          <ActiveProjects projects={dashboardData.activeProjects} />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TodaysSchedule 
            meetings={dashboardData.todaysMeetings}
            onViewCalendar={() => router.push('/calendar')}
          />
          <UpcomingTasks 
            tasks={dashboardData.upcomingTasks}
            onViewTasks={() => router.push('/tasks')}
          />
        </div>
      </div>
    </div>
  )
}
