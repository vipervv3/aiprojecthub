'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import Sidebar from '@/components/layout/sidebar'
import MetricsCards from '@/components/dashboard/metrics-cards'
import AIAssistant from '@/components/dashboard/ai-assistant'
import RecentActivity from '@/components/dashboard/recent-activity'
import ActiveProjects from '@/components/dashboard/active-projects'
import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import { dataService } from '@/lib/data-service'

interface DashboardData {
  totalProjects: number
  activeTasks: number
  completedTasks: number
  teamMembers: number
  recentActivity: any[]
  activeProjects: any[]
}

export default function Dashboard() {
  const { user, loading, loggingOut } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
    recentActivity: [],
    activeProjects: []
  })
  const [loadingData, setLoadingData] = useState(true)

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

      // Format recent activity
      const recentActivity = activities.map(activity => ({
        id: activity.id,
        type: activity.action,
        message: `${activity.action} ${activity.entity_type}`,
        created_at: activity.created_at,
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
        recentActivity,
        activeProjects
      })

      // Save data to local storage as backup
      dataService.saveToLocalStorage('projects', projects)
      dataService.saveToLocalStorage('tasks', tasks)
      dataService.saveToLocalStorage('activities', activities)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty data if there's an error
      setDashboardData({
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        teamMembers: 0,
        recentActivity: [],
        activeProjects: []
      })
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

  if (loggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Signing out...</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user.user_metadata?.name || user.email}!</p>
            </div>

            <MetricsCards 
              totalProjects={dashboardData.totalProjects}
              activeTasks={dashboardData.activeTasks}
              completedTasks={dashboardData.completedTasks}
              teamMembers={dashboardData.teamMembers}
              loading={loadingData}
            />

            {/* AI Assistant Banner - Second Row */}
            <div className="mt-8">
              <AIAssistant />
            </div>

            {/* Recent Activity and Active Projects - Third Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <RecentActivity activities={dashboardData.recentActivity} />
              <ActiveProjects projects={dashboardData.activeProjects} />
            </div>
          </div>
        </div>
      </div>
      <FloatingActionButtons />
    </div>
  )
}