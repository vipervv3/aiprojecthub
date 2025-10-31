'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  CheckSquare, 
  Calendar, 
  UserPlus,
  CheckCircle,
  FileText
} from 'lucide-react'
import FloatingActionButtons from '@/components/layout/floating-action-buttons'
import KanbanBoard from '@/components/tasks/kanban-board'
import { dataService } from '@/lib/data-service'
import { toast } from 'react-hot-toast'
import ProjectMembersModal from '@/components/projects/project-members-modal'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ai_priority_score?: number
  is_ai_generated?: boolean
  due_date?: string
  assignee_id?: string
  project_id: string
  projects: {
    name: string
  }
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
  description?: string
  status: string
  progress: number
  due_date?: string
  team_members?: any[]
  created_at: string
}

const MetricCard: React.FC<{
  title: string
  value: string
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
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${getColorClasses(color)}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showMembersModal, setShowMembersModal] = useState(false)

  useEffect(() => {
    const loadProjectData = async () => {
      if (user && projectId) {
        try {
          setLoadingData(true)
          const userId = user.id || 'demo-user'
          
          // Load real project data from database
          const projects = await dataService.getProjects(userId)
          const foundProject = projects.find(p => p.id === projectId)

          if (foundProject) {
            setProject(foundProject as any)
            
            // Load tasks for this project
            const allTasks = await dataService.getTasks(userId)
            const projectTasks = allTasks.filter(t => t.project_id === projectId).map(task => ({
              ...task,
              projects: { name: foundProject.name }
            }))
            setTasks(projectTasks as any[])
          } else {
            // Fallback to mock data if project not found
            const mockProject: Project = {
              id: projectId,
              name: 'Project 1',
              description: 'Project 1 description',
              status: 'active',
              progress: 0,
              due_date: '2025-08-30',
              team_members: [],
              created_at: '2024-01-01'
            }

            setProject(mockProject)
            
            // Load all tasks for this project from database
            const allTasks = await dataService.getTasks(userId)
            const projectTasks = allTasks.filter(t => t.project_id === projectId).map(task => ({
              ...task,
              projects: { name: mockProject.name }
            }))
            
            if (projectTasks.length > 0) {
              setTasks(projectTasks as any[])
            } else {
              // Mock tasks if no real ones found
              const mockTasks: Task[] = [
                {
                  id: '1',
                  title: 'omar test task 9-21-2025',
                  description: '',
                  status: 'todo',
                  priority: 'medium',
                  project_id: projectId,
                  projects: { name: mockProject.name },
                  created_at: '2024-01-01',
                  updated_at: '2024-01-01'
                }
              ]
              setTasks(mockTasks)
            }
          }
        } catch (error) {
          console.error('Error loading project:', error)
        } finally {
          setLoadingData(false)
        }
      }
    }

    loadProjectData()
  }, [user, projectId])

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    console.log('🎯 Updating task status on project page:', { taskId, newStatus })
    
    try {
      // Update in database
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      console.log('📡 Response status:', response.status)
      
      const result = await response.json()
      console.log('📡 Response data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update task status')
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus as any, updated_at: new Date().toISOString() }
          : task
      ))

      console.log('✅ Task updated successfully')
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('❌ Error updating task:', error)
      toast.error('Failed to update task: ' + (error as Error).message)
    }
  }

  const handleBackToProjects = () => {
    router.push('/projects')
  }

  const handleAddTask = () => {
    // TODO: Open add task modal
    console.log('Add task')
  }

  const handleInviteMember = () => {
    setShowMembersModal(true)
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
          <p className="text-gray-600">You need to be logged in to access project details.</p>
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
            onClick={handleBackToProjects}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToProjects}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {project.status}
              </span>
              <span className="text-gray-600">
                Due: {project.due_date ? new Date(project.due_date).toLocaleDateString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'No due date'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddTask}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
              <button
                onClick={handleInviteMember}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite Member
              </button>
            </div>
          </div>
        </div>

        {/* Project Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Progress"
            value={`${project.progress}%`}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          <MetricCard
            title="Total Tasks"
            value={tasks.length.toString()}
            icon={<CheckSquare className="h-5 w-5" />}
            color="blue"
          />
          <MetricCard
            title="Due Date"
            value={project.due_date ? new Date(project.due_date).toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric'
            }) : 'No due date'}
            icon={<Calendar className="h-5 w-5" />}
            color="purple"
          />
          <MetricCard
            title="Team Members"
            value={Array.isArray(project.team_members) ? project.team_members.length.toString() : '1'}
            icon={<Users className="h-5 w-5" />}
            color="yellow"
          />
          <MetricCard
            title="Meeting Prep"
            value="Prepare for meetings"
            icon={<FileText className="h-5 w-5" />}
            color="red"
          />
        </div>

        {/* Task Management - Kanban Board with Drag & Drop */}
        <KanbanBoard
          tasks={tasks}
          onTaskUpdate={updateTaskStatus}
        />

        {/* Floating Action Buttons */}
        <FloatingActionButtons />
      </div>

      {/* Project Members Modal */}
      <ProjectMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        projectId={projectId}
        projectName={project?.name || ''}
        isOwner={true} // TODO: Determine if current user is owner
      />
    </div>
  )
}
