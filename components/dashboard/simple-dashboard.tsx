'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { 
  FolderOpen, 
  Clock, 
  CheckCircle, 
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
  onClick?: () => void
}> = ({ title, value, icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all ${
      onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500' : ''
    }`}
  >
    <div className="flex items-center">
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  </div>
)

const AIAssistantBanner: React.FC<{ onStartRecording: () => void; onViewInsights: () => void }> = ({ 
  onStartRecording, 
  onViewInsights 
}) => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 rounded-lg text-white relative overflow-hidden">
    <div className="relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">AI-Powered Meeting Assistant</h3>
          <p className="text-blue-100 mb-4 text-sm sm:text-base">Record meetings, transcribe automatically, and extract tasks with AI</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onStartRecording}
              className="bg-white/20 hover:bg-white/30 px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-colors touch-manipulation"
            >
              <Mic className="h-4 w-4" />
              <span className="text-sm sm:text-base">Start Recording</span>
            </button>
            <button 
              onClick={onViewInsights}
              className="bg-white/20 hover:bg-white/30 px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-colors touch-manipulation"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm sm:text-base">View AI Insights</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute top-4 right-4 text-white/30 hidden sm:block">
      <Mic className="h-16 w-16 opacity-20" />
    </div>
  </div>
)

const RecentActivity: React.FC<{ activities: any[]; onViewAll: () => void }> = ({ activities, onViewAll }) => {
  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name || name === 'Someone') return '?'
    if (name === 'You') return 'Y'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get color for activity type
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-green-500'
      case 'updated': return 'bg-blue-500'
      case 'completed': return 'bg-purple-500'
      case 'deleted': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
        <button 
          onClick={onViewAll}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium touch-manipulation"
        >
          View all
        </button>
      </div>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Team actions will appear here</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              onClick={onViewAll}
            >
              {/* User Avatar */}
              <div className={`w-8 h-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold`}>
                {getUserInitials(activity.user)}
              </div>
              
              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  <span className="font-medium">{activity.user}</span>
                  {' '}
                  <span className="text-gray-600 dark:text-gray-400">
                    {activity.message.replace(activity.user, '').trim()}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.created_at}</p>
              </div>
              
              {/* Arrow indicator on hover */}
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const ActiveProjects: React.FC<{ projects: any[]; onViewAll: () => void; onProjectClick: (projectId: string) => void }> = ({ projects, onViewAll, onProjectClick }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Projects</h3>
      <button 
        onClick={onViewAll}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        View all
      </button>
    </div>
    <div className="space-y-4">
      {projects.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No active projects</p>
      ) : (
        projects.map((project, index) => (
          <div 
            key={project.id || index} 
            className="space-y-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => onProjectClick(project.id)}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{project.name}</h4>
              <span className="text-sm text-gray-600 dark:text-gray-400">{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)

const TodaysSchedule: React.FC<{ meetings: any[]; onViewCalendar: () => void; onMeetingClick: (meetingId: string) => void }> = ({ meetings, onViewCalendar, onMeetingClick }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today's Schedule</h3>
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
        <p className="text-gray-600 dark:text-gray-300 font-medium">No meetings today</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Your scheduled meetings for today will appear here.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {meetings.map((meeting, index) => (
          <div 
            key={meeting.id || index}
            onClick={() => meeting.id && onMeetingClick(meeting.id)}
            className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
          >
            <Video className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{meeting.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{meeting.time}</p>
            </div>
            {meeting.hasTranscript && (
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)

const UpcomingTasks: React.FC<{ tasks: any[]; onViewTasks: () => void; onTaskClick: (taskId: string) => void }> = ({ tasks, onViewTasks, onTaskClick }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming Tasks</h3>
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
        <p className="text-gray-600 dark:text-gray-300 font-medium">No upcoming tasks</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Tasks due this week will appear here.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            onClick={() => onTaskClick(task.id)}
            className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
          >
            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
              task.priority === 'urgent' ? 'bg-red-500' :
              task.priority === 'high' ? 'bg-orange-500' :
              task.priority === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">{task.dueDate}</p>
                {task.is_ai_generated && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">AI</span>
                )}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
              task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
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

      // ✅ SECURITY FIX: Load recordings and meetings for current user only
      let totalRecordings = 0
      let todaysMeetings: any[] = []
      
      if (supabase && user?.id) {
        // First, get user's recording sessions
        const { data: userSessions } = await supabase
          .from('recording_sessions')
          .select('id')
          .eq('user_id', user.id)
        
        const userSessionIds = userSessions?.map(s => s.id) || []
        totalRecordings = userSessionIds.length
        
        // Load meetings that belong to user's recording sessions
        if (userSessionIds.length > 0) {
          const { data: meetingsData } = await supabase
            .from('meetings')
            .select('*')
            .in('recording_session_id', userSessionIds)
            .order('scheduled_at', { ascending: false })
          
          if (meetingsData) {
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

      // Format recent activity with descriptive messages
      const recentActivity = await Promise.all(
        activities.slice(0, 5).map(async (activity) => {
          // Get entity name from details
          const entityName = activity.details?.title || activity.details?.name || 'item'
          
          // Fetch user info for this activity
          let actorName = 'Someone'
          if (supabase && activity.user_id) {
            try {
              const { data: actorData } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', activity.user_id)
                .single()
              
              if (actorData) {
                actorName = actorData.name || actorData.email?.split('@')[0] || 'Someone'
              } else if (activity.user_id === user?.id) {
                actorName = 'You'
              }
            } catch (error) {
              console.warn('Failed to fetch actor name:', error)
              // Fallback: if it's the current user
              if (activity.user_id === user?.id) {
                actorName = 'You'
              }
            }
          } else if (activity.user_id === user?.id) {
            actorName = 'You'
          }
          
          // Build descriptive message based on action and details
          let message = ''
          
          if (activity.action === 'created') {
            message = `${actorName} created ${activity.entity_type} "${entityName}"`
          } else if (activity.action === 'updated') {
            // Check if it's a status change
            if (activity.details?.new_status && activity.details?.old_status) {
              message = `${actorName} moved "${entityName}" from ${activity.details.old_status} to ${activity.details.new_status}`
            } else if (activity.details?.changes?.length > 0) {
              const changes = activity.details.changes.join(', ')
              message = `${actorName} updated ${activity.entity_type} "${entityName}" (${changes})`
            } else {
              message = `${actorName} updated ${activity.entity_type} "${entityName}"`
            }
          } else if (activity.action === 'completed') {
            message = `${actorName} completed ${activity.entity_type} "${entityName}"`
          } else if (activity.action === 'deleted') {
            message = `${actorName} deleted ${activity.entity_type} "${entityName}"`
          } else {
            message = `${actorName} ${activity.action} ${activity.entity_type} "${entityName}"`
          }
          
          return {
            id: activity.id,
            type: activity.action,
            message: message,
            created_at: new Date(activity.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            user: actorName
          }
        })
      )

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
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user?.user_metadata?.name || 'Omar'}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Metrics Cards - Clickable! */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Projects"
            value={dashboardData.totalProjects}
            icon={<FolderOpen className="h-6 w-6 text-gray-600" />}
            onClick={() => router.push('/projects')}
          />
          <MetricCard
            title="Active Tasks"
            value={dashboardData.activeTasks}
            icon={<Clock className="h-6 w-6 text-gray-600" />}
            onClick={() => router.push('/tasks')}
          />
          <MetricCard
            title="Completed Tasks"
            value={dashboardData.completedTasks}
            icon={<CheckCircle className="h-6 w-6 text-gray-600" />}
            onClick={() => router.push('/tasks')}
          />
          <MetricCard
            title="Recordings"
            value={dashboardData.totalRecordings}
            icon={<Mic className="h-6 w-6 text-gray-600" />}
            onClick={() => router.push('/meetings')}
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
          <RecentActivity 
            activities={dashboardData.recentActivity}
            onViewAll={() => router.push('/tasks')}
          />
          <ActiveProjects 
            projects={dashboardData.activeProjects}
            onViewAll={() => router.push('/projects')}
            onProjectClick={(projectId) => router.push(`/projects/${projectId}`)}
          />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TodaysSchedule 
            meetings={dashboardData.todaysMeetings}
            onViewCalendar={() => router.push('/calendar')}
            onMeetingClick={(meetingId) => router.push(`/meetings/${meetingId}`)}
          />
          <UpcomingTasks 
            tasks={dashboardData.upcomingTasks}
            onViewTasks={() => router.push('/tasks')}
            onTaskClick={(taskId) => router.push(`/tasks?taskId=${taskId}`)}
          />
        </div>
      </div>
    </div>
  )
}
